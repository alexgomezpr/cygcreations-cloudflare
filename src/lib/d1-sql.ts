import schemaSql from "../../migrations/d1/0001_schema.sql?raw";
import type { Sql } from "./db";

export interface D1Prepared {
  bind(...values: unknown[]): D1Prepared;
  all<T>(): Promise<{ results?: T[] }>;
  run(): Promise<{ meta?: { changes?: number; last_row_id?: number } }>;
}

export interface D1Database {
  prepare(sql: string): D1Prepared;
  exec(sql: string): Promise<unknown>;
}

type WorkersModule = { env?: { DB?: D1Database } };

const globalRef = globalThis as typeof globalThis & { __d1Ready__?: Promise<void> };

export async function getD1(): Promise<D1Database> {
  const mod = (await import(/* @vite-ignore */ "cloudflare:workers")) as WorkersModule;
  const db = mod.env?.DB;
  if (!db) throw new Error("Cloudflare D1 binding DB is not set. Create the database and add its id to wrangler.json.");
  return db;
}

function toD1Sql(text: string) {
  return text.replace(/::int\b/g, "").replace(/::text\b/g, "").replace(/\bnow\(\)/g, "datetime('now')");
}

function bindValue(value: unknown) {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  return value;
}

async function run<T>(text: string, params: unknown[]): Promise<T[]> {
  const db = await getD1();
  const sqlText = toD1Sql(text).replace(/\$(\d+)/g, "?");
  const values = params.map(bindValue);
  const statement = values.length ? db.prepare(sqlText).bind(...values) : db.prepare(sqlText);
  const result = await statement.all<T>();
  return result.results ?? [];
}

function toSql(runQuery: typeof run): Sql {
  const sql = (async <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
    return runQuery<T>(text, values);
  }) as Sql;
  sql.query = (text, params = []) => runQuery(text, params);
  return sql;
}

async function ready() {
  const db = await getD1();
  const statements = schemaSql
    .split(/;\s*(?:\r?\n|$)/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !part.startsWith("--"));
  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

export async function createD1Sql(): Promise<Sql> {
  globalRef.__d1Ready__ ??= ready().catch((error) => {
    globalRef.__d1Ready__ = undefined;
    throw error;
  });
  await globalRef.__d1Ready__;
  return toSql(run);
}
