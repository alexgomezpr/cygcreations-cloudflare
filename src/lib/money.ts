export function money(cents: number | null | undefined): string {
  if (cents == null) return "Price on request";
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function parsePrice(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000) {
    throw new Error("Enter a price in dollars, or leave it blank.");
  }
  return Math.round(amount * 100);
}

export function httpsUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Use a full link, starting with https://");
  }
  if (url.protocol !== "https:") throw new Error("The link must start with https://");
  return url.toString();
}
