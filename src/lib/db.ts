import { createD1Sql } from "./d1-sql";

/** Cloudflare build always uses D1. */
export type DbSource = "d1";
export const dbSource: DbSource = "d1";

export interface Sql {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

let sqlPromise: Promise<Sql> | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error("@/lib/db is server-only — call getSql() from a server function, never from client code.");
  }
  return createD1Sql();
}

export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((error) => {
    sqlPromise = null;
    throw error;
  });
  return sqlPromise;
}

export function ensureDbReady(): Promise<void> {
  return getSql().then(() => undefined);
}
