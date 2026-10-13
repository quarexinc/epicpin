import { q } from "@/lib/db";
import { verifyOsb } from "@/lib/shopier";
import { processOsb } from "@/lib/osb";

export const dynamic = "force-dynamic";

const text = (body: string, status = 200) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

/**
 * Shopier OSB (Otomatik Sipariş Bildirimi) adresi.
 * Shopier her satışta res (base64 JSON) ve hash alanlarını POST eder; "success" yanıtı bekler.
 */
export async function POST(req: Request) {
  let res = "";
  let hash = "";
  try {
    const fd = await req.formData();
    res = String(fd.get("res") ?? "");
    hash = String(fd.get("hash") ?? "");
  } catch {
    try {
      const j = await req.json();
      res = String(j.res ?? "");
      hash = String(j.hash ?? "");
    } catch {}
  }
  if (!res || !hash) return text("missing parameter", 400);

  const rows = await q<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key IN ('osb_username', 'osb_key')");
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  if (!s.osb_username || !s.osb_key) return text("osb not configured", 503);

  const payload = verifyOsb(res, hash, s.osb_username, s.osb_key);
  if (!payload) return text("unauthorized", 401);

  try {
    await processOsb(payload, Buffer.from(res, "base64").toString("utf8"));
  } catch (e) {
    console.error("[EpicPin] OSB işlenemedi:", e);
    return text("error", 500);
  }
  return text("success");
}

export async function GET() {
  return text("EpicPin OSB adresi hazır. Shopier bu adrese POST ile bildirim gönderir.");
}
