import "server-only";
import { one, q, tx } from "./db";
import { bust } from "./bust";
import { performCheckout, quoteCart, type CartLine } from "./checkout";
import { newRandomNr, shopierConfig } from "./shopier";

async function allSettings() {
  const rows = await q<{ key: string; value: string }>("SELECT key, value FROM settings");
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;
  return s;
}

export async function shopierMethod() {
  return one<{ id: number; name: string; commission: number; min_amount: number; active: boolean }>(
    "SELECT id, name, commission, min_amount, active FROM payment_methods WHERE kind = 'shopier' ORDER BY id LIMIT 1",
  );
}

/** Kartla ödeme açık mı (yöntem aktif ve API bilgileri girilmiş)? */
export async function shopierReady() {
  const [m, s] = await Promise.all([shopierMethod(), allSettings()]);
  return !!(m?.active && shopierConfig(s));
}

type Buyer = { name: string; surname: string; phone: string };

function cleanBuyer(b: Buyer) {
  const name = b.name.trim().slice(0, 50);
  const surname = b.surname.trim().slice(0, 50);
  const phone = b.phone.replace(/[^\d+]/g, "").slice(0, 16);
  if (name.length < 2 || surname.length < 2) throw new Error("Kart sahibinin adını ve soyadını yaz.");
  if (phone.replace(/\D/g, "").length < 10) throw new Error("Geçerli bir telefon numarası yaz (ör. 05xx xxx xx xx).");
  return { name, surname, phone };
}

/** Shopier ödeme kaydı oluşturur; müşteri ardından /odeme/shopier/[id] sayfasına gider. */
export async function createShopierPayment(
  user: { id: number; balance: number },
  input: { kind: "deposit"; amount: number; buyer: Buyer } | { kind: "cart"; items: CartLine[]; coupon?: string | null; buyer: Buyer },
) {
  const [m, s] = await Promise.all([shopierMethod(), allSettings()]);
  if (!m?.active || !shopierConfig(s)) throw new Error("Kartla ödeme şu an kullanılamıyor.");
  const buyer = cleanBuyer(input.buyer);
  const commission = Number(m.commission) || 0;
  let amount: number;
  let items: string | null = null;
  let coupon: string | null = null;
  if (input.kind === "deposit") {
    amount = Math.round(Number(input.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Geçerli bir tutar yaz.");
    if (amount < Number(m.min_amount)) throw new Error(`Kartla en az ${Number(m.min_amount).toFixed(2)} ₺ yükleyebilirsin.`);
    if (amount > 50000) throw new Error("Tek seferde en fazla 50.000 ₺ yükleyebilirsin.");
  } else {
    const quote = await quoteCart(user.id, input.items, input.coupon);
    // Bakiyedeki tutar önce kullanılır, kalanı kartla ödenir
    amount = Math.round(Math.max(quote.total - Number(user.balance), 1) * 100) / 100;
    items = JSON.stringify(quote.list);
    coupon = quote.code;
  }
  const charge = Math.round(amount * (1 + commission / 100) * 100) / 100;
  const [p] = await q<{ id: number }>(
    `INSERT INTO shopier_payments (user_id, kind, amount, charge, items, coupon_code, buyer_name, buyer_surname, buyer_phone, random_nr)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [user.id, input.kind, amount, charge, items, coupon, buyer.name, buyer.surname, buyer.phone, newRandomNr()],
  );
  return p.id;
}

/**
 * Onaylanan ödemeyi işler (tekrar çağrılırsa bir şey yapmaz):
 * tutarı bakiyeye ekler, sepet ödemesiyse siparişi oluşturur.
 */
export async function completeShopierPayment(id: number, info: { paymentId?: string; installment?: string; manualBy?: string }) {
  const res = await tx(async (t) => {
    const [p] = await t<any>("SELECT * FROM shopier_payments WHERE id = $1 FOR UPDATE", [id]);
    if (!p || p.status === "paid") return null;
    await t("UPDATE shopier_payments SET status = 'paid', payment_id = $1, installment = $2, paid_at = now(), note = $3 WHERE id = $4", [
      info.paymentId ?? null,
      info.installment ?? null,
      info.manualBy ? `Elle onaylandı: ${info.manualBy}` : null,
      id,
    ]);
    await t("UPDATE users SET balance = balance + $1 WHERE id = $2", [p.amount, p.user_id]);
    await t("INSERT INTO balance_logs (user_id, amount, description) VALUES ($1,$2,$3)", [p.user_id, p.amount, `Kartla ödeme (Shopier #${id})`]);
    await t(
      "INSERT INTO deposits (user_id, method_name, amount, sender_name, note, status, admin_note, resolved_at) VALUES ($1,'Kredi / Banka Kartı',$2,$3,$4,'approved',$5,now())",
      [p.user_id, p.amount, `${p.buyer_name} ${p.buyer_surname}`, `Shopier ödeme no: ${info.paymentId ?? "-"}`, "Shopier ile otomatik onaylandı"],
    );
    return p;
  });
  if (!res) return;
  if (res.kind === "cart" && res.items) {
    try {
      const orderId = await performCheckout(res.user_id, JSON.parse(res.items), res.coupon_code);
      await q("UPDATE shopier_payments SET order_id = $1 WHERE id = $2", [orderId, id]);
    } catch (e: any) {
      await q("UPDATE shopier_payments SET note = $1 WHERE id = $2", [
        `Ödeme alındı ve bakiyeye eklendi ama sipariş oluşturulamadı: ${e?.message ?? "bilinmeyen hata"}`,
        id,
      ]);
    }
  }
  bust("stats");
}

export async function failShopierPayment(id: number, reason: string) {
  await q("UPDATE shopier_payments SET status = 'failed', note = $1 WHERE id = $2 AND status = 'pending'", [reason.slice(0, 300), id]);
}
