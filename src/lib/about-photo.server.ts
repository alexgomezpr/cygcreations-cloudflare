import { getSql } from "@/lib/db";

export async function aboutJpeg(_width: number): Promise<Response> {
  const sql = await getSql();
  const rows = await sql<{ about_image: string }>`select about_image from studio where id = 1`;
  const image = rows[0]?.about_image ?? "";
  if (!image.startsWith("data:image/")) return new Response("Not found", { status: 404 });
  const encoded = image.slice(image.indexOf(",") + 1);
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const type = image.startsWith("data:image/png") ? "image/png" : "image/jpeg";
  return new Response(bytes, {
    headers: { "content-type": type, "cache-control": "public, max-age=86400" },
  });
}
