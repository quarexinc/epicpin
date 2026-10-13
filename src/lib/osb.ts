import "server-only";
import { one, q, tx } from "./db";
import { bust } from "./bust";
import { mailCodes } from "./mail";
import { OSB_CURRENCY, osbProducts, type OsbPayload } from "./shopier";

type Line = { title: string; codes: string[] };

/**
 * Shopier mağazasında yapılan bir satışı işler:
 * ürünü Shopier ürün numarasından ilana eşler, stoktan kodu verir,
 * alıcı sitede üyeyse siparişlerine ekler ve kodları e-postayla gönderir.
 */
export async function processOsb(p: OsbPayload, raw: string) {
  const orderId = String(p.orderid ?? "").trim();
  if (!orderId) return { status: "invalid" as const };
  const exists = await one<{ id: number; status: string }>("SELECT id, status FROM osb_orders WHERE shopier_order_id = $1", [orderId]);
  if (exists) return { status: "duplicate" as const, id: exists.id };

  const email = String(p.email ?? "").trim().toLowerCase();
  const products = osbProducts(p);
  const isTest = String(p.istest ?? "0") === "1";
  const [row] = await q<{ id: number }>(
    `INSERT INTO osb_orders (shopier_order_id, email, buyer_name, price, currency, product_ids, product_count, customer_note, is_test, status, raw)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10) ON CONFLICT (shopier_order_id) DO NOTHING RETURNING id`,
    [
      orderId,
      email,
      `${p.buyername ?? ""} ${p.buyersurname ?? ""}`.trim(),
      Number(p.price) || null,
      OSB_CURRENCY[String(p.currency ?? "0")] ?? String(p.currency ?? ""),
      products.map((x) => (x.qty > 1 ? `${x.id}x${x.qty}` : x.id)).join(", "),
      products.reduce((a, b) => a + b.qty, 0) || 1,
      String(p.customernote ?? "").slice(0, 1000),
      isTest,
      raw.slice(0, 20000),
    ],
  );
  if (!row) return { status: "duplicate" as const };
  const id = row.id;

  if (isTest) {
    await q("UPDATE osb_orders SET status = 'test', note = 'Shopier test bildirimi: bağlantı çalışıyor, stoktan kod verilmedi.' WHERE id = $1", [id]);
    return { status: "test" as const, id };
  }

  const user = email ? await one<{ id: number }>("SELECT id FROM users WHERE lower(email) = $1 AND NOT banned", [email]) : null;
  const notes: string[] = [];
  const lines: Line[] = [];
  let wanted = 0;
  let delivered = 0;
  let siteOrderId = null as number | null;
  let matchedCount = 0;

  await tx(async (t) => {
    const matched: { l: any; qty: number }[] = [];
    for (const pr of products) {
      wanted += pr.qty;
      const [l] = await t<any>("SELECT id, title, price, delivery_type FROM listings WHERE shopier_product_id = $1 ORDER BY id LIMIT 1", [pr.id]);
      if (!l) notes.push(`Shopier ürünü ${pr.id} hiçbir ilanla eşleşmedi.`);
      else matched.push({ l, qty: pr.qty });
    }
    matchedCount = matched.length;
    if (!matched.length) return;

    if (user) {
      const total = Number(p.price) || matched.reduce((a, m) => a + Number(m.l.price) * m.qty, 0);
      const [o] = await t<{ id: number }>("INSERT INTO orders (user_id, total, subtotal, discount, coupon_code) VALUES ($1,$2,$2,0,'SHOPIER') RETURNING id", [user.id, total]);
      siteOrderId = o.id;
    }

    for (const { l, qty } of matched) {
      let codes: string[] = [];
      let itemId: number | null = null;
      if (siteOrderId) {
        const [it] = await t<{ id: number }>(
          "INSERT INTO order_items (order_id, listing_id, title, unit_price, quantity, delivery_type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
          [siteOrderId, l.id, l.title, l.price, qty, l.delivery_type],
        );
        itemId = it.id;
      }
      if (l.delivery_type === "auto") {
        const pick = `SELECT id FROM stock_codes WHERE listing_id = $1 AND order_item_id IS NULL ORDER BY id LIMIT $2 FOR UPDATE SKIP LOCKED`;
        const got = itemId
          ? await t<{ code: string }>(`UPDATE stock_codes SET order_item_id = $3 WHERE id IN (${pick}) RETURNING code`, [l.id, qty, itemId])
          : await t<{ code: string }>(`DELETE FROM stock_codes WHERE id IN (${pick}) RETURNING code`, [l.id, qty]);
        codes = got.map((g) => g.code);
        if (codes.length < qty) notes.push(`"${l.title}" için stok yetmedi: ${qty} istendi, ${codes.length} verildi.`);
      } else {
        notes.push(`"${l.title}" manuel teslimatlı, elle teslim etmen gerekiyor.`);
      }
      if (itemId) {
        if (codes.length >= qty)
          await t("UPDATE order_items SET status = 'delivered', delivered_content = $1, delivered_at = now() WHERE id = $2", [codes.join("\n"), itemId]);
        else if (codes.length) await t("UPDATE order_items SET delivered_content = $1 WHERE id = $2", [codes.join("\n"), itemId]);
      }
      await t("UPDATE listings SET sold_count = sold_count + $1 WHERE id = $2", [qty, l.id]);
      delivered += codes.length;
      if (codes.length) lines.push({ title: l.title, codes });
    }
  });

  const content = lines.map((l) => `${l.title}\n${l.codes.join("\n")}`).join("\n\n") || null;
  const status = wanted > 0 && delivered >= wanted ? "delivered" : delivered > 0 ? "partial" : matchedCount === 0 ? "unmatched" : "no_stock";

  let emailSent = false;
  if (lines.length && email) {
    try {
      emailSent = await mailCodes(email, `Shopier #${orderId}`, lines, "Shopier üzerinden verdiğin sipariş için kodların aşağıda.");
    } catch (e: any) {
      notes.push(`E-posta gönderilemedi: ${e?.message ?? e}`);
    }
  }
  await q("UPDATE osb_orders SET status = $1, delivered_content = $2, user_id = $3, order_id = $4, email_sent = $5, note = $6 WHERE id = $7", [
    status,
    content,
    user?.id ?? null,
    siteOrderId,
    emailSent,
    notes.join("\n") || null,
    id,
  ]);
  bust("listings", "stats");
  return { status, id };
}
