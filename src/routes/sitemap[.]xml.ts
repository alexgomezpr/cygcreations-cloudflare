import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { SITE_ORIGIN } from "@/lib/seo";

function lastmod(value: unknown): string | null {
  const date = value instanceof Date ? value : new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function urlEntry(loc: string, priority: string, updated?: unknown) {
  const modified = updated ? lastmod(updated) : null;
  return `  <url><loc>${loc}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sql = await getSql();
        const works = await sql<{ id: number; updated_at: string }>`
          select id, updated_at from works where status <> 'draft' order by id asc
        `;
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntry(`${SITE_ORIGIN}/`, "1.0")}
${urlEntry(`${SITE_ORIGIN}/policies`, "0.4", "2026-10-20")}
${works.map((work) => urlEntry(`${SITE_ORIGIN}/work/${work.id}`, "0.8", work.updated_at)).join("\n")}
</urlset>
`;
        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
