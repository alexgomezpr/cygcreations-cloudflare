export const SITE_ORIGIN = "https://cygcreations.com";
/** Live published host. Share cards fetch this file; cygcreations.com is not connected yet. */
export const SHARE_ORIGIN = "https://cygcreations.grok.me";

type JsonLd = Record<string, unknown>;

export function absoluteUrl(path: string): string {
  if (path.startsWith("https://")) return path;
  if (!path.startsWith("/")) return `${SITE_ORIGIN}/og.jpg`;
  return `${SITE_ORIGIN}${path}`;
}

function shareImage(input: string): string {
  if (!input || input.startsWith("data:")) return `${SHARE_ORIGIN}/og.jpg`;
  if (input.startsWith("https://") || input.startsWith("http://")) {
    try {
      const url = new URL(input);
      if (url.hostname === "cygcreations.com") return `${SHARE_ORIGIN}${url.pathname}${url.search}`;
      return input;
    } catch {
      return `${SHARE_ORIGIN}/og.jpg`;
    }
  }
  return `${SHARE_ORIGIN}${input.startsWith("/") ? input : "/og.jpg"}`;
}

export function clip(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const last = cut.lastIndexOf(" ");
  return `${(last > 80 ? cut.slice(0, last) : cut).trim()}…`;
}

export function seoHead(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: JsonLd | JsonLd[];
}) {
  const path = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const url = `${SITE_ORIGIN}${path === "/" ? "/" : path}`;
  const imagePath = input.image && !input.image.startsWith("data:") ? input.image : "/og.jpg";
  const image = shareImage(imagePath);
  const card = imagePath.split("?")[0].endsWith("/og.jpg");
  const blocks = input.jsonLd ? (Array.isArray(input.jsonLd) ? input.jsonLd : [input.jsonLd]) : [];

  return {
    meta: [
      { title: input.title },
      { name: "description", content: input.description },
      {
        name: "robots",
        content: input.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
      },
      { property: "og:title", content: input.title },
      { property: "og:description", content: input.description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:alt", content: input.title },
      ...(card
        ? [
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
          ]
        : []),
      { property: "og:type", content: input.type ?? "website" },
      { name: "twitter:title", content: input.title },
      { name: "twitter:description", content: input.description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: input.title },
    ],
    links: input.noindex ? [] : [{ rel: "canonical", href: url }],
    scripts: blocks.map((data) => ({
      type: "application/ld+json",
      children: JSON.stringify(data),
    })),
  };
}
