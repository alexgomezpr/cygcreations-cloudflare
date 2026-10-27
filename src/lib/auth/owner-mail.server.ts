import { appendFile } from "node:fs/promises";
import { isOwnerEmail } from "./owners.server";

const DEV_LOG = "/tmp/cy-owner-mail.log";

function resetLink(url: string, token: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}/api/auth/reset-password/${encodeURIComponent(token)}?callbackURL=${encodeURIComponent("/studio")}`;
  } catch {
    return url;
  }
}

async function pause(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Same wait for owner and non-owner so the response time does not reveal the list. */
async function withFloor(task: () => Promise<void>) {
  const started = Date.now();
  try {
    await task();
  } catch {
    console.error("owner email failed");
  }
  const rest = 400 - (Date.now() - started);
  if (rest > 0) await pause(rest);
}

async function deliver(to: string, subject: string, text: string) {
  const email = to.trim().toLowerCase();
  if (!isOwnerEmail(email)) return;
  const key = process.env.RESEND_API_KEY?.trim();
  if (key) {
    const from = process.env.OWNER_EMAIL_FROM?.trim() || "Cy Creations <onboarding@resend.dev>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [email], subject, text }),
    });
    if (!response.ok) console.error("owner email failed", response.status);
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    await appendFile(DEV_LOG, `\n---\nTo: ${email}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  console.error("owner email is not configured");
}

export async function sendOwnerReset(input: { user: { email: string }; url: string; token: string }) {
  const link = resetLink(input.url, input.token);
  await withFloor(() =>
    deliver(
      input.user.email,
      "Cy Creations password reset",
      `Use this link to choose a new studio password. It expires in one hour.\n\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
    ),
  );
}

export async function sendOwnerSetup(input: { email: string; url: string }) {
  await withFloor(() =>
    deliver(
      input.email,
      "Cy Creations studio link",
      `Use this one-time link to set up your studio login. It expires in 30 minutes.\n\n${input.url}\n\nIf you didn't ask for this, you can ignore this email.`,
    ),
  );
}
