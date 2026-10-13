import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "crypto";

/**
 * Shopier entegrasyonu
 *
 * 1) Kartla ödeme (Shopier API): Müşteri imzalı bir formla Shopier'in ödeme sayfasına gönderilir.
 *    Ödeme bitince Shopier, panelde tanımlanan "Geri dönüş URL"sine tarayıcı üzerinden POST yapar
 *    (platform_order_id, status, payment_id, installment, random_nr, signature).
 *    İstek imzası: base64(HMAC-SHA256(random_nr + platform_order_id + total_order_value + currency, API_SECRET))
 *    Dönüş imzası: base64(HMAC-SHA256(random_nr + platform_order_id, API_SECRET))
 *
 * 2) OSB (Otomatik Sipariş Bildirimi): Shopier mağazandan satılan ürünler için Shopier sunucusu
 *    bildirim adresine POST yapar: res (base64 JSON) ve hash.
 *    hash = hex(HMAC-SHA256(res + OSB_KULLANICI_ADI, OSB_ANAHTARI)). Yanıt olarak "success" beklenir.
 */

export const SHOPIER_PAY_URL = "https://www.shopier.com/ShowProduct/api_pay4.php";

export type ShopierConfig = { apiKey: string; apiSecret: string; websiteIndex: number };

export function shopierConfig(s: Record<string, string>): ShopierConfig | null {
  const apiKey = (s.shopier_api_key || "").trim();
  const apiSecret = (s.shopier_api_secret || "").trim();
  if (!apiKey || !apiSecret) return null;
  const wi = Math.min(5, Math.max(1, Number(s.shopier_website_index) || 1));
  return { apiKey, apiSecret, websiteIndex: wi };
}

export function newRandomNr() {
  return String(randomInt(100000, 999999));
}

export function platformOrderId(paymentId: number) {
  return `EP${paymentId}`;
}

export function parsePlatformOrderId(v: string) {
  const m = /^EP(\d+)$/.exec(v.trim());
  return m ? Number(m[1]) : null;
}

/** Shopier ödeme sayfasına gönderilecek form alanlarını üretir. */
export function buildPaymentFields(
  cfg: ShopierConfig,
  p: {
    paymentId: number;
    randomNr: string;
    charge: number;
    productName: string;
    buyer: { id: number; name: string; surname: string; email: string; phone: string; accountAgeDays: number };
  },
) {
  const total = p.charge.toFixed(2);
  const orderId = platformOrderId(p.paymentId);
  const currency = 0; // 0: TL
  const signature = createHmac("sha256", cfg.apiSecret).update(`${p.randomNr}${orderId}${total}${currency}`).digest("base64");
  const address = "Dijital teslimat";
  return {
    API_key: cfg.apiKey,
    website_index: String(cfg.websiteIndex),
    platform_order_id: orderId,
    product_name: p.productName.slice(0, 120),
    product_type: "1", // 1: indirilebilir / dijital ürün
    buyer_name: p.buyer.name,
    buyer_surname: p.buyer.surname,
    buyer_email: p.buyer.email,
    buyer_account_age: String(Math.max(0, Math.floor(p.buyer.accountAgeDays))),
    buyer_id_nr: String(p.buyer.id),
    buyer_phone: p.buyer.phone,
    billing_address: address,
    billing_city: "Istanbul",
    billing_country: "Turkey",
    billing_postcode: "34000",
    shipping_address: address,
    shipping_city: "Istanbul",
    shipping_country: "Turkey",
    shipping_postcode: "34000",
    total_order_value: total,
    currency: String(currency),
    platform: "0",
    is_in_frame: "0",
    current_language: "0",
    modul_version: "1.0.4",
    random_nr: p.randomNr,
    signature,
  };
}

function safeEq(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Shopier'in geri dönüş isteğindeki imzayı doğrular. */
export function verifyCallback(
  body: { random_nr?: string; platform_order_id?: string; signature?: string; total_order_value?: string; currency?: string },
  apiSecret: string,
) {
  if (!body.random_nr || !body.platform_order_id || !body.signature) return false;
  let given: Buffer;
  try {
    given = Buffer.from(body.signature, "base64");
  } catch {
    return false;
  }
  const candidates = [`${body.random_nr}${body.platform_order_id}`];
  if (body.total_order_value != null) candidates.push(`${body.random_nr}${body.platform_order_id}${body.total_order_value}${body.currency ?? ""}`);
  return candidates.some((msg) => safeEq(createHmac("sha256", apiSecret).update(msg).digest(), given));
}

export type OsbPayload = {
  email?: string;
  orderid?: string | number;
  currency?: string | number;
  price?: string | number;
  buyername?: string;
  buyersurname?: string;
  productcount?: string | number;
  productid?: string | number;
  productlist?: string;
  customernote?: string;
  istest?: string | number;
  [k: string]: unknown;
};

/** OSB bildirimini doğrular ve içeriğini çözer. Geçersizse null döner. */
export function verifyOsb(res: string, hash: string, username: string, key: string): OsbPayload | null {
  const expected = createHmac("sha256", key).update(res + username).digest("hex");
  if (!safeEq(Buffer.from(expected), Buffer.from(hash.trim().toLowerCase()))) return null;
  try {
    return JSON.parse(Buffer.from(res, "base64").toString("utf8")) as OsbPayload;
  } catch {
    return null;
  }
}

/** OSB bildirimindeki ürün kimliklerini ve adetleri çıkarır. */
export function osbProducts(p: OsbPayload): { id: string; qty: number }[] {
  const count = Math.max(1, Math.floor(Number(p.productcount) || 1));
  const list = String(p.productlist ?? "")
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (list.length > 1) {
    // Aynı ürün listede birden çok kez geçebilir; her geçiş bir adet sayılır
    const m = new Map<string, number>();
    for (const id of list) m.set(id, (m.get(id) ?? 0) + 1);
    return [...m].map(([id, qty]) => ({ id, qty }));
  }
  const id = String(p.productid ?? list[0] ?? "").trim();
  return id ? [{ id, qty: count }] : [];
}

export const OSB_CURRENCY: Record<string, string> = { "0": "TRY", "1": "USD", "2": "EUR" };
