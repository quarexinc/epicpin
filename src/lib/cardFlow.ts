import "server-only";
import { one, q, tx } from "./db";
import { bust } from "./bust";
import { performCheckout, quoteCart, type CartLine } from "./checkout";
import { getIframeToken, merchantOid, paytrConfig, PAYTR_FAIL_REASONS } from "./paytr";

async function allSettings() {
  const rows = await q<{ key: string; value: string }>("SELECT key, value FROM settings");
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;
  return s;
}

export async function cardMethod() {
  return one<{ id: number; name: string; commission: number; min_amount: number; active: boolean; instructions: string }>(
    "SELECT id, name, commission, min_amount, active, instructions FROM payment_methods WHERE kind = 'paytr' ORDER BY id LIMIT 1",
  );
}

/** Kartla ödeme açık mı (yöntem aktif ve PayTR bilgileri girilmiş)? */
export async function cardReady() {
  const [m, s] = await Promise.all([cardMethod(), allSettings()]);
  return !!(m?.active && paytrConfig(s));
}

type Buyer = { name: string; phone: string };

function cleanBuyer(b: Buyer) {
  const name = b.name.trim().replace(/\s+/g, " ").slice(0, 60);
  const phone = b.phone.replace(/[^\d+]/g, "").slice(0, 20);
  if (name.split(" ").length < 2 || name.length < 5) throw new Error("Kart sahibinin adını ve soyadını yaz.");
  if (phone.replace(/\D/g, "").length < 10) throw new Error("Geçerli bir telefon numarası yaz (ör. 05xx xxx xx xx).");
  return { name, phone };
}

/**
 * Kartla ödeme kaydı oluşturur ve PayTR'den ödeme token'ı alır.
 * Dönen kayıt numarasıyla müşteri /odeme/kart/[id] sayfasındaki ödeme formuna gider.
 */
export async function createCardPayment(
  user: { id: number; email: string; balance: number },
  ctx: { ip: string; origin: string },
  input: { kind: "deposit"; amount: number; buyer: Buyer } | { kind: "cart"; items: CartLine[]; coupon?: string | null; buyer: Buyer },
) {
  const [m, s] = await Promise.all([cardMethod(), allSettings()]);
  const cfg = paytrConfig(s);
  if (!m?.active || !cfg) throw new Error("Kartla ödeme şu an kullanılamıyor.");
  const buyer = cleanBuyer(input.buyer);
  const commission = Number(m.commission) || 0;
  let amount: number;
  let items: string | null = null;
  let coupon: string | null = null;
  let label: string;
  const site = s.site_name || "EpicPin";
  if (input.kind === "deposit") {
    amount = Math.round(Number(input.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Geçerli bir tutar yaz.");
    if (amount < Number(m.min_amount)) throw new Error(`Kartla en az ${Number(m.min_amount).toFixed(2)} ₺ yükleyebilirsin.`);
    if (amount > 50000) throw new Error("Tek seferde en fazla 50.000 ₺ yükleyebilirsin.");
    label = `${site} bakiye yükleme`;
  } else {
    const quote = await quoteCart(user.id, input.items, input.coupon);
    // Bakiyedeki tutar önce kullanılır, kalanı kartla ödenir
    amount = Math.round(Math.max(quote.total - Number(user.balance), 1) * 100) / 100;
    items = JSON.stringify(quote.list);
    coupon = quote.code;
    label = `${site} sipariş: ${quote.title}`.slice(0, 120);
  }
  const charge = Math.round(amount * (1 + commission / 100) * 100) / 100;
  const [p] = await q<{ id: number }>(
    `INSERT INTO card_payments (provider, user_id, kind, amount, charge, items, coupon_code, buyer_name, buyer_phone, user_ip, test_mode)
     VALUES ('paytr',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [user.id, input.kind, amount, charge, items, coupon, buyer.name, buyer.phone, ctx.ip, cfg.testMode],
  );
  const oid = merchantOid(p.id);
  await q("UPDATE card_payments SET merchant_oid = $1 WHERE id = $2", [oid, p.id]);
  try {
    const token = await getIframeToken(cfg, {
      oid,
      userIp: ctx.ip,
      email: user.email,
      amount: charge,
      basket: [[label, charge.toFixed(2), 1]],
      userName: buyer.name,
      userPhone: buyer.phone,
      userAddress: "Dijital teslimat, Türkiye",
      okUrl: `${ctx.origin}/odeme/sonuc/${p.id}`,
      failUrl: `${ctx.origin}/odeme/sonuc/${p.id}?hata=1`,
    });
    await q("UPDATE card_payments SET token = $1, token_at = now() WHERE id = $2", [token, p.id]);
  } catch (e: any) {
    await q("UPDATE card_payments SET status = 'failed', note = $1 WHERE id = $2", [String(e?.message ?? e).slice(0, 300), p.id]);
    throw e;
  }
  return p.id;
}

/**
 * Onaylanan ödemeyi işler (aynı bildirim tekrar gelirse bir şey yapmaz):
 * tutarı bakiyeye ekler, sepet ödemesiyse siparişi oluşturur.
 */
export async function completeCardPayment(id: number, info: { totalAmount?: number; paymentType?: string; manualBy?: string }) {
  const res = await tx(async (t) => {
    const [p] = await t<any>("SELECT * FROM card_payments WHERE id = $1 FOR UPDATE", [id]);
    if (!p || p.status === "paid") return null;
    await t("UPDATE card_payments SET status = 'paid', total_amount = $1, payment_type = $2, paid_at = now(), note = $3 WHERE id = $4", [
      info.totalAmount ?? p.charge,
      info.paymentType ?? null,
      info.manualBy ? `Elle onaylandı: ${info.manualBy}` : null,
      id,
    ]);
    await t("UPDATE users SET balance = balance + $1 WHERE id = $2", [p.amount, p.user_id]);
    await t("INSERT INTO balance_logs (user_id, amount, description) VALUES ($1,$2,$3)", [p.user_id, p.amount, `Kartla ödeme (#${p.merchant_oid ?? id})`]);
    await t(
      "INSERT INTO deposits (user_id, method_name, amount, sender_name, note, status, admin_note, resolved_at) VALUES ($1,'Kredi / Banka Kartı',$2,$3,$4,'approved',$5,now())",
      [p.user_id, p.amount, p.buyer_name, `PayTR sipariş no: ${p.merchant_oid ?? id}`, "PayTR ile otomatik onaylandı"],
    );
    return p;
  });
  if (!res) return;
  if (res.kind === "cart" && res.items) {
    try {
      const orderId = await performCheckout(res.user_id, JSON.parse(res.items), res.coupon_code);
      await q("UPDATE card_payments SET order_id = $1 WHERE id = $2", [orderId, id]);
    } catch (e: any) {
      await q("UPDATE card_payments SET note = $1 WHERE id = $2", [
        `Ödeme alındı ve bakiyeye eklendi ama sipariş oluşturulamadı: ${e?.message ?? "bilinmeyen hata"}`,
        id,
      ]);
    }
  }
  bust("stats");
}

export async function failCardPayment(id: number, code?: string, msg?: string) {
  const reason = (code && code !== "0" ? PAYTR_FAIL_REASONS[code] : null) || msg || PAYTR_FAIL_REASONS["0"];
  await q("UPDATE card_payments SET status = 'failed', note = $1 WHERE id = $2 AND status = 'pending'", [reason.slice(0, 300), id]);
}
