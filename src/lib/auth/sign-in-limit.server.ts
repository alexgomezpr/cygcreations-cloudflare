import { getSql } from "@/lib/db";

type Rule = { window: number; max: number };

/**
 * Shared sign-in limiter. `consume` is atomic enough for one SQL statement.
 * If the table is missing, allow the request so a public page does not die.
 */
export function signInLimitStorage() {
  return {
    async get() {
      return null;
    },
    async set() {},
    async consume(key: string, rule: Rule) {
      try {
        const sql = await getSql();
        const rows = await sql.query<{ count: number; window_started: string }>(
          "select count, window_started from sign_in_limit where key = $1",
          [key.slice(0, 200)],
        );
        const now = Date.now();
        const windowSeconds = Math.max(1, Math.floor(rule.window));
        const started = rows[0] ? Date.parse(String(rows[0].window_started)) : 0;
        const fresh = !rows[0] || Number.isNaN(started) || now - started >= windowSeconds * 1000;
        const count = fresh ? 1 : Number(rows[0]?.count ?? 0) + 1;
        const windowStarted = fresh || !rows[0] ? new Date(now).toISOString() : String(rows[0].window_started);
        if (!rows[0]) {
          await sql.query("insert into sign_in_limit (key, count, window_started) values ($1, $2, $3)", [
            key.slice(0, 200),
            count,
            windowStarted,
          ]);
        } else {
          await sql.query("update sign_in_limit set count = $1, window_started = $2 where key = $3", [
            count,
            windowStarted,
            key.slice(0, 200),
          ]);
        }
        if (count > rule.max) {
          const retryAfter = Math.max(1, Math.ceil((started + windowSeconds * 1000 - now) / 1000));
          return { allowed: false, retryAfter };
        }
        return { allowed: true, retryAfter: null };
      } catch (error) {
        console.error("sign-in limit unavailable", error instanceof Error ? error.message : "");
        return { allowed: true, retryAfter: null };
      }
    },
  };
}
