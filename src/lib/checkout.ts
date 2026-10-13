import "server-only";
import { one, q, tx, type Q } from "./db";
import { bust } from "./bust";
import { mailCodes } from "./mail";

export type CartLine = { id: number; qty: number };

export function cleanItems(items: CartLine[]) {
  return items
    .map((i) => ({ id: Math.floor(Number(i.id)), qty: Math.floor(Number(i.qty)) }))
    .filter((i) => i.id > 0 && i.qty > 0 && i.qty <= 99)
    .slice(0, 50);
}

type Coupon = { id: number; code: string; kind: string; value: number; min_total: number; max_uses: number | null; used_count: number; per_user_once: boolean; expires_at: string | null; active: boolean };

/** Kuponu kontrol eder; geçerliyse indirim tutarını döner, değilse hata fırlatır. */
export async function checkCoupon(run: Q, code: string, userId: number, subtotal: number, lock = false) {
  const [c] = await run<Coupon>(`SELECT * FROM coupons WHERE upper(code) = upper($1) ${lock ? "FOR UPDATE" : ""}`, [code.trim()]);
  if (!c || !c.active) throw new Error("Bu indirim kodu geçerli değil.");
  if (c.expires_at && new Date(c.expires_at) < new Date()) throw new Error("Bu indirim kodunun süresi dolmuş.");
  if (c.max_uses != null && c.used_count >= c.max_uses) throw new Error("Bu indirim kodunun kullanım limiti doldu.");
  if (subtotal < Number(c.min_total)) throw new Error(`Bu kod ${Number(c.min_total).toFixed(2)} ₺ ve üzeri siparişlerde geçerli.`);
  if (c.per_user_once) {
    const [used] = await run("SELECT 1 FROM orders WHERE user_id = $1 AND upper(coupon_code) = upper($2) LIMIT 1", [userId, c.code]);
    if (used) throw new Error("Bu indirim kodunu daha önce kullandın.");
  }
  const raw = c.kind === "percent" ? (subtotal * Number(c.value)) / 100 : Number(c.value);
  const discount = Math.min(Math.round(raw * 100) / 100, subtotal);
  return { coupon: c, discount };
}


/** Sepetin güncel tutarını (kupon dahil) hesaplar; stok ve satış durumunu kontrol eder. */
export async function quoteCart(userId: number, items: CartLine[], couponCode?: string | null) {
  const list = cleanItems(items);
  if (!list.length) throw new Error("Sepetin boş.");
  let subtotal = 0;
  const titles: string[] = [];
  for (const it of list) {
    const l = await one<any>(
      `SELECT l.id, l.title, l.price, l.active, l.delivery_type, l.manual_stock,
        (SELECT COUNT(*)::int FROM stock_codes s WHERE s.listing_id = l.id AND s.order_item_id IS NULL) AS codes
       FROM listings l WHERE l.id = $1`,
      [it.id],
    );
    if (!l || !l.active) throw new Error("Sepetindeki bir ürün artık satışta değil. Sepeti güncelle.");
    const stock = l.delivery_type === "auto" ? l.codes : l.manual_stock;
    if (stock < it.qty) throw new Error(`"${l.title}" için yeterli stok yok (kalan: ${stock}).`);
    subtotal += Number(l.price) * it.qty;
    titles.push(it.qty > 1 ? `${it.qty}x ${l.title}` : l.title);
  }
  subtotal = Math.round(subtotal * 100) / 100;
  let discount = 0;
  let code: string | null = null;
  if (couponCode?.trim()) {
    const c = await checkCoupon(q, couponCode, userId, subtotal);
    discount = c.discount;
    code = c.coupon.code;
  }
  return { list, subtotal, discount, code, total: Math.round((subtotal - discount) * 100) / 100, title: titles.join(", ") };
}

/** Bakiyeyle sipariş oluşturur, otomatik ürünlerin kodlarını teslim eder. Hata olursa fırlatır. */
export async function performCheckout(userId: number, items: CartLine[], couponCode?: string | null) {
  const list = cleanItems(items);
  if (!list.length) throw new Error("Sepetin boş.");
  const u = { id: userId };
  const orderId = await tx(async (t) => {
      const [user] = await t<{ balance: number }>("SELECT balance FROM users WHERE id = $1 FOR UPDATE", [u.id]);
      const rows: { l: { id: number; title: string; price: number; delivery_type: string; manual_stock: number; active: boolean }; qty: number }[] = [];
      for (const it of list) {
        const [l] = await t<any>("SELECT id, title, price, delivery_type, manual_stock, active FROM listings WHERE id = $1 FOR UPDATE", [it.id]);
        if (!l || !l.active) throw new Error("Sepetindeki bir ürün artık satışta değil. Sepeti güncelle.");
        if (l.delivery_type === "auto") {
          const [{ c }] = await t<{ c: number }>("SELECT COUNT(*)::int AS c FROM stock_codes WHERE listing_id = $1 AND order_item_id IS NULL", [l.id]);
          if (c < it.qty) throw new Error(`"${l.title}" için yeterli stok yok (kalan: ${c}).`);
        } else if (l.manual_stock < it.qty) throw new Error(`"${l.title}" için yeterli stok yok (kalan: ${l.manual_stock}).`);
        rows.push({ l, qty: it.qty });
      }
      const subtotal = Math.round(rows.reduce((a, r) => a + Number(r.l.price) * r.qty, 0) * 100) / 100;
      let discount = 0;
      let code: string | null = null;
      if (couponCode?.trim()) {
        const c = await checkCoupon(t, couponCode, u.id, subtotal, true);
        discount = c.discount;
        code = c.coupon.code;
        await t("UPDATE coupons SET used_count = used_count + 1 WHERE id = $1", [c.coupon.id]);
      }
      const total = Math.round((subtotal - discount) * 100) / 100;
      if (Number(user.balance) < total)
        throw new Error(`Bakiyen yetersiz. Gereken: ${total.toFixed(2)} ₺, bakiyen: ${Number(user.balance).toFixed(2)} ₺.`);

      const [order] = await t<{ id: number }>("INSERT INTO orders (user_id, total, subtotal, discount, coupon_code) VALUES ($1,$2,$3,$4,$5) RETURNING id", [
        u.id,
        total,
        subtotal,
        discount,
        code,
      ]);
      for (const { l, qty } of rows) {
        const [item] = await t<{ id: number }>(
          "INSERT INTO order_items (order_id, listing_id, title, unit_price, quantity, delivery_type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
          [order.id, l.id, l.title, l.price, qty, l.delivery_type],
        );
        if (l.delivery_type === "auto") {
          const codes = await t<{ code: string }>(
            `UPDATE stock_codes SET order_item_id = $1 WHERE id IN (
               SELECT id FROM stock_codes WHERE listing_id = $2 AND order_item_id IS NULL ORDER BY id LIMIT $3 FOR UPDATE SKIP LOCKED
             ) RETURNING code`,
            [item.id, l.id, qty],
          );
          if (codes.length < qty) throw new Error(`"${l.title}" için stok tükendi.`);
          await t("UPDATE order_items SET status = 'delivered', delivered_content = $1, delivered_at = now() WHERE id = $2", [
            codes.map((c) => c.code).join("\n"),
            item.id,
          ]);
        } else {
          await t("UPDATE listings SET manual_stock = manual_stock - $1 WHERE id = $2", [qty, l.id]);
        }
        await t("UPDATE listings SET sold_count = sold_count + $1 WHERE id = $2", [qty, l.id]);
      }
      await t("UPDATE users SET balance = balance - $1 WHERE id = $2", [total, u.id]);
      await t("INSERT INTO balance_logs (user_id, amount, description) VALUES ($1,$2,$3)", [u.id, -total, `Sipariş #${order.id}`]);
      return order.id;
  });
  bust("listings", "stats");
  // Kodları e-postayla da gönder (SMTP ayarlıysa)
  try {
    const s = await one<{ value: string }>("SELECT value FROM settings WHERE key = 'mail_order_codes'");
    if (s?.value === "on") {
      const user = await one<{ email: string }>("SELECT email FROM users WHERE id = $1", [userId]);
      const rows = await q<{ title: string; delivered_content: string }>(
        "SELECT title, delivered_content FROM order_items WHERE order_id = $1 AND status = 'delivered' AND delivered_content IS NOT NULL",
        [orderId],
      );
      if (user && rows.length) await mailCodes(user.email, `#${orderId}`, rows.map((r) => ({ title: r.title, codes: r.delivered_content.split("\n") })));
    }
  } catch (e) {
    console.error("[EpicPin] Sipariş e-postası gönderilemedi:", e);
  }
  return orderId;
}
