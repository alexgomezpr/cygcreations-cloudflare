import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const portalAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { isOwnerEmail } = await import("./owners.server");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const users = await sql.query<{ email: string }>('select email from "user" where id = $1', [context.userId]);
    const email = users[0]?.email ?? "";
    if (!isOwnerEmail(email)) return { owner: false, needsPassword: false };
    const accounts = await sql.query<{ password: string | null }>(
      `select password from "account" where "userId" = $1 and "providerId" = 'credential' limit 1`,
      [context.userId],
    );
    const password = accounts[0]?.password ?? "";
    return { owner: true, needsPassword: password.length === 0 };
  });

export const setPortalPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { password?: string }) => {
    const password = String(input?.password ?? "");
    if (password.length < 8 || password.length > 128) throw new Error("Use at least 8 characters.");
    return { password };
  })
  .handler(async ({ context, data }) => {
    const { isOwnerEmail } = await import("./owners.server");
    const { getSql } = await import("@/lib/db");
    const { auth } = await import("./server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const sql = await getSql();
    const users = await sql.query<{ email: string }>('select email from "user" where id = $1', [context.userId]);
    if (!isOwnerEmail(users[0]?.email ?? "")) throw new Error("That sign-in didn't open the studio.");
    const headers = new Headers(getRequest().headers);
    if (context.bearerToken) headers.set("authorization", `Bearer ${context.bearerToken}`);
    try {
      await auth.api.setPassword({ body: { newPassword: data.password }, headers });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/already has a password/i.test(message)) {
        throw new Error("A password is already set. Sign in with it, or use Forgot password.");
      }
      throw new Error("Could not save that password.");
    }
    return { ok: true };
  });
