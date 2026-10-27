import {
  CompiledQuery,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type DatabaseConnection,
  type Dialect,
  type Driver,
  type QueryResult,
} from "kysely";
import { getD1, type D1Database } from "./d1-sql";

class D1Connection implements DatabaseConnection {
  constructor(private readonly db: D1Database) {}

  async executeQuery<R>(compiled: CompiledQuery): Promise<QueryResult<R>> {
    const parameters = compiled.parameters.map(bindValue);
    const statement = parameters.length
      ? this.db.prepare(compiled.sql).bind(...parameters)
      : this.db.prepare(compiled.sql);
    const sql = compiled.sql.trim().toLowerCase();
    const returnsRows = sql.startsWith("select") || sql.includes(" returning ");
    if (returnsRows) {
      const result = await statement.all<R>();
      return { rows: result.results ?? [] };
    }
    const result = await statement.run();
    return {
      rows: [],
      numAffectedRows: BigInt(result.meta?.changes ?? 0),
      insertId: BigInt(result.meta?.last_row_id ?? 0),
    };
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("D1 does not stream queries.");
  }
}

class D1Driver implements Driver {
  async init() {}
  async acquireConnection() {
    return new D1Connection(await getD1());
  }
  async beginTransaction(connection: DatabaseConnection) {
    await connection.executeQuery(CompiledQuery.raw("begin"));
  }
  async commitTransaction(connection: DatabaseConnection) {
    await connection.executeQuery(CompiledQuery.raw("commit"));
  }
  async rollbackTransaction(connection: DatabaseConnection) {
    await connection.executeQuery(CompiledQuery.raw("rollback"));
  }
  async releaseConnection() {}
  async destroy() {}
}

function bindValue(value: unknown) {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  return value;
}

/** Better Auth database dialect for Cloudflare D1. */
export function d1Dialect(): Dialect {
  return {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new D1Driver(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  };
}
