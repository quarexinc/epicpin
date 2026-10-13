import { one } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{32}$/.test(id)) return new Response("Bulunamadı", { status: 404 });
  const img = await one<{ mime: string; data: string }>("SELECT mime, data FROM images WHERE id = $1", [id]);
  if (!img) return new Response("Bulunamadı", { status: 404 });
  return new Response(Buffer.from(img.data, "base64"), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(img.mime === "image/svg+xml" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
    },
  });
}
