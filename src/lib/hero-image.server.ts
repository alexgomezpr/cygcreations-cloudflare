import { getSql } from "@/lib/db";

export async function heroJpeg(id: number, _width: number, requestUrl: string): Promise<Response> {
  if (!Number.isInteger(id) || id < 1) return new Response("Not found", { status: 404 });
  const sql = await getSql();
  const rows = await sql<{ image_src: string }>`
    select image_src from works where id = ${id} and status <> 'draft'
  `;
  const imageSrc = rows[0]?.image_src;
  if (!imageSrc) return new Response("Not found", { status: 404 });
  try {
    const body = await readPiece(imageSrc, requestUrl);
    return new Response(body, {
      headers: {
        "content-type": contentType(body, imageSrc),
        "cache-control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

async function readPiece(imageSrc: string, requestUrl: string): Promise<Uint8Array> {
  if (imageSrc.startsWith("data:image/")) {
    const encoded = imageSrc.slice(imageSrc.indexOf(",") + 1);
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  if (!imageSrc.startsWith("/") || imageSrc.includes("..")) throw new Error("Bad image path.");
  const response = await fetch(new URL(imageSrc, requestUrl));
  if (!response.ok) throw new Error("Missing image.");
  return new Uint8Array(await response.arrayBuffer());
}

function contentType(body: Uint8Array, imageSrc: string) {
  if (body[0] === 0xff && body[1] === 0xd8) return "image/jpeg";
  if (body[0] === 0x89 && body[1] === 0x50) return "image/png";
  if (imageSrc.startsWith("data:image/png") || imageSrc.endsWith(".png")) return "image/png";
  return "image/jpeg";
}
