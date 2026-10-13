import { q } from "@/lib/db";
import { parsePlatformOrderId, shopierConfig, verifyCallback } from "@/lib/shopier";
import { completeShopierPayment, failShopierPayment } from "@/lib/shopierFlow";

export const dynamic = "force-dynamic";

/**
 * Shopier "Geri dönüş URL"si. Ödeme bitince Shopier müşterinin tarayıcısını buraya POST ile gönderir.
 * İmza doğrulanır, ödeme işlenir ve müşteri sonuç sayfasına yönlendirilir.
 */
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const back = (path: string) => new Response(null, { status: 303, headers: { Location: `${origin}${path}` } });
  let body: Record<string, string> = {};
  try {
    const fd = await req.formData();
    fd.forEach((v, k) => (body[k] = String(v)));
  } catch {
    try {
      body = await req.json();
    } catch {}
  }
  const rows = await q<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key LIKE 'shopier_%'");
  const cfg = shopierConfig(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  const id = parsePlatformOrderId(body.platform_order_id ?? "");
  if (!cfg || !id) return back("/odeme/sonuc/0");

  if (!verifyCallback(body, cfg.apiSecret)) {
    console.warn("[EpicPin] Shopier geri dönüş imzası geçersiz", body.platform_order_id);
    return back(`/odeme/sonuc/${id}?hata=imza`);
  }
  const [p] = await q<{ random_nr: string }>("SELECT random_nr FROM shopier_payments WHERE id = $1", [id]);
  if (!p || p.random_nr !== body.random_nr) return back(`/odeme/sonuc/${id}?hata=kayit`);

  if ((body.status ?? "").toLowerCase() === "success") {
    await completeShopierPayment(id, { paymentId: body.payment_id, installment: body.installment });
  } else {
    await failShopierPayment(id, body.error_message ? `Shopier: ${body.error_message}` : "Ödeme Shopier tarafından onaylanmadı.");
  }
  return back(`/odeme/sonuc/${id}`);
}

export async function GET(req: Request) {
  return new Response(null, { status: 303, headers: { Location: new URL("/", req.url).toString() } });
}
