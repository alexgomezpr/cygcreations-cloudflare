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

const GMAIL_OWNER_HASH =
  "d57987a23070a0ca2d4f48d8f850ea24:f55c502bd2e437b89e5ca5ebcfb596131c632c53cad5c181cf803d9d77b12ed767eeff2641985b5c13585399b7b4acd9528e2581ca03c36c16c990b8ad9dc239";

async function ensureGmailOwner(db: D1Database) {
  await db
    .prepare(
      `insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       select 'owner-gmail', 'Cy Creations', 'cygcreationss@gmail.com', 1, datetime('now'), datetime('now')
       where not exists (select 1 from "user" where lower(email) = 'cygcreationss@gmail.com')`,
    )
    .run();
  await db
    .prepare(
      `update "account" set password = ?, "updatedAt" = datetime('now')
       where "providerId" = 'credential'
         and "userId" in (select id from "user" where lower(email) = 'cygcreationss@gmail.com')`,
    )
    .bind(GMAIL_OWNER_HASH)
    .run();
  await db
    .prepare(
      `insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       select 'owner-gmail-credential', u.id, 'credential', u.id, ?, datetime('now'), datetime('now')
       from "user" u
       where lower(u.email) = 'cygcreationss@gmail.com'
         and not exists (
           select 1 from "account" a where a."userId" = u.id and a."providerId" = 'credential'
         )`,
    )
    .bind(GMAIL_OWNER_HASH)
    .run();
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
  await ensureGmailOwner(db);
}

export async function createD1Sql(): Promise<Sql> {
  globalRef.__d1Ready__ ??= ready().catch((error) => {
    globalRef.__d1Ready__ = undefined;
    throw error;
  });
  await globalRef.__d1Ready__;
  return toSql(run);
}
