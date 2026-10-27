/** Studio editors. Server-only — never import this from a client component. */
const OWNER_EMAILS = new Set(["cygcreationss@gmail.com", "alexgomezpr@hotmail.com"]);

export function isOwnerEmail(email: string): boolean {
  return OWNER_EMAILS.has(email.trim().toLowerCase());
}
