import { q } from "@/lib/db";
import { paytrConfig, verifyNotification } from "@/lib/paytr";
import { completeCardPayment, failCardPayment } from "@/lib/cardFlow";

export const dynamic = "force-dynamic";

const text = (body: string, status = 200) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

/**
 * PayTR Bildirim URL'si (sunucudan sunucuya).
 * Hash doğrulanır, ödeme bir kez işlenir ve düz metin "OK" döner.
 * Aynı sipariş için gelen tekrar bildirimler işlem yapılmadan "OK" ile yanıtlanır.
 */
export async function POST(req: Request) {
  const b: Record<string, string> = {};
  try {
    (await req.formData()).forEach((v, k) => (b[k] = String(v)));
  } catch {
    return text("bad request", 400);
  }
  const rows = await q<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key LIKE 'paytr\\_%'");
  const cfg = paytrConfig(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  if (!cfg) return text("PAYTR not configured", 503);
  if (!verifyNotification(cfg, b)) {
    console.warn("[EpicPin] PayTR bildirim hash'i geçersiz:", b.merchant_oid);
    return text("PAYTR notification failed: bad hash", 400);
  }

  const [p] = await q<{ id: number; status: string }>("SELECT id, status FROM card_payments WHERE merchant_oid = $1", [b.merchant_oid]);
  if (!p) return text("OK"); // Bu siteye ait olmayan ya da silinmiş sipariş: PayTR tekrar denemesin
  if (p.status === "pending") {
    if (b.status === "success") {
      // Tahsil edilen tutar sipariş tutarından az olamaz (taksit farkıyla fazla olabilir)
      const [row] = await q<{ charge: number }>("SELECT charge FROM card_payments WHERE id = $1", [p.id]);
      if (Number(b.total_amount) + 1 < Math.round(Number(row.charge) * 100)) {
        await failCardPayment(p.id, undefined, `Tutar uyuşmazlığı: PayTR ${Number(b.total_amount) / 100} ₺ bildirdi, beklenen ${row.charge} ₺. PayTR panelinden kontrol et.`);
        return text("OK");
      }
      await completeCardPayment(p.id, { totalAmount: Number(b.total_amount) / 100, paymentType: b.payment_type });
    } else {
      await failCardPayment(p.id, b.failed_reason_code, b.failed_reason_msg);
    }
  }
  return text("OK");
}

export async function GET() {
  return text("EpicPin PayTR bildirim adresi hazır. PayTR bu adrese POST ile ödeme sonucu gönderir.");
}
