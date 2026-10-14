import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * PayTR iFrame API
 *
 * 1. Adım: Sunucudan https://www.paytr.com/odeme/api/get-token adresine POST ile token alınır.
 *    paytr_token = base64(HMAC-SHA256(merchant_id + user_ip + merchant_oid + email + payment_amount +
 *                  user_basket + no_installment + max_installment + currency + test_mode + merchant_salt, merchant_key))
 *    Dönen token ile https://www.paytr.com/odeme/guvenli/{token} adresi iframe içinde açılır.
 *
 * 2. Adım: PayTR ödeme sonucunu mağaza panelinde tanımlı "Bildirim URL"sine sunucudan sunucuya POST eder.
 *    hash = base64(HMAC-SHA256(merchant_oid + merchant_salt + status + total_amount, merchant_key))
 *    Yanıt olarak düz metin "OK" beklenir. Aynı bildirim birden fazla gelebilir.
 */

export const PAYTR_BASE = (process.env.PAYTR_BASE_URL || "https://www.paytr.com").replace(/\/$/, "");

export type PaytrConfig = {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  testMode: boolean;
  debug: boolean;
  noInstallment: boolean;
  maxInstallment: number;
};

export function paytrConfig(s: Record<string, string>): PaytrConfig | null {
  const merchantId = (s.paytr_merchant_id || "").trim();
  const merchantKey = (s.paytr_merchant_key || "").trim();
  const merchantSalt = (s.paytr_merchant_salt || "").trim();
  if (!merchantId || !merchantKey || !merchantSalt) return null;
  const max = Number(s.paytr_max_installment) || 0;
  return {
    merchantId,
    merchantKey,
    merchantSalt,
    testMode: s.paytr_test_mode === "on",
    debug: s.paytr_debug === "on",
    noInstallment: s.paytr_installment !== "on",
    maxInstallment: max >= 2 && max <= 12 ? max : 0,
  };
}

/** PayTR sipariş numarası: yalnızca harf ve rakam. */
/** İstemci IP'si: PayTR en fazla 39 karakter kabul eder. */
export function cleanIp(ip: string) {
  const v = ip.trim().replace(/^::ffff:/, "");
  return v.length > 0 && v.length <= 39 ? v : "127.0.0.1";
}

export function merchantOid(paymentId: number) {
  return `EP${paymentId}T${Date.now().toString(36).toUpperCase()}`;
}

const hmacB64 = (key: string, msg: string) => createHmac("sha256", key).update(msg, "utf8").digest("base64");

/** E-posta Türkçe karakter içeremez; içerirse sadeleştirilir. */
function asciiEmail(e: string) {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "C", Ğ: "G", İ: "I", Ö: "O", Ş: "S", Ü: "U" };
  return e.replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => map[c] ?? c).slice(0, 100);
}

export type TokenRequest = {
  oid: string;
  userIp: string;
  email: string;
  amount: number; // TL
  basket: [string, string, number][];
  userName: string;
  userPhone: string;
  userAddress: string;
  okUrl: string;
  failUrl: string;
};

/** 1. Adım: ödeme token'ı alır. Hata olursa açıklamayla birlikte fırlatır. */
export async function getIframeToken(cfg: PaytrConfig, r: TokenRequest): Promise<string> {
  const paymentAmount = String(Math.round(r.amount * 100));
  // PayTR örnekleriyle aynı biçim: Türkçe karakterler \uXXXX olarak kaçışlanır
  const basketJson = JSON.stringify(r.basket).replace(/[\u0080-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  const userBasket = Buffer.from(basketJson, "utf8").toString("base64");
  const noInstallment = cfg.noInstallment ? "1" : "0";
  const maxInstallment = String(cfg.maxInstallment);
  const currency = "TL";
  const testMode = cfg.testMode ? "1" : "0";
  const email = asciiEmail(r.email);
  const userIp = cleanIp(r.userIp);
  if (!(r.amount > 0)) throw new Error("Ödeme tutarı geçersiz.");
  const hashStr = cfg.merchantId + userIp + r.oid + email + paymentAmount + userBasket + noInstallment + maxInstallment + currency + testMode;
  const body = new URLSearchParams({
    merchant_id: cfg.merchantId,
    user_ip: userIp,
    merchant_oid: r.oid,
    email,
    payment_amount: paymentAmount,
    paytr_token: hmacB64(cfg.merchantKey, hashStr + cfg.merchantSalt),
    user_basket: userBasket,
    debug_on: cfg.debug ? "1" : "0",
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: r.userName.slice(0, 60),
    user_address: r.userAddress.slice(0, 400),
    user_phone: r.userPhone.slice(0, 20),
    merchant_ok_url: r.okUrl,
    merchant_fail_url: r.failUrl,
    timeout_limit: "30",
    currency,
    test_mode: testMode,
    lang: "tr",
  });
  let res: Response;
  try {
    res = await fetch(`${PAYTR_BASE}/odeme/api/get-token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error("Ödeme sağlayıcısına bağlanılamadı. Biraz sonra tekrar dene.");
  }
  const text = await res.text();
  let json: { status?: string; token?: string; reason?: string };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`PayTR beklenmeyen yanıt verdi (HTTP ${res.status}).`);
  }
  if (json.status !== "success" || !json.token) throw new Error(`PayTR: ${json.reason || "ödeme başlatılamadı"}`);
  return json.token;
}

export function iframeUrl(token: string) {
  return `${PAYTR_BASE}/odeme/guvenli/${encodeURIComponent(token)}`;
}

/** 2. Adım: bildirimin PayTR'den geldiğini doğrular. */
export function verifyNotification(cfg: PaytrConfig, b: { merchant_oid?: string; status?: string; total_amount?: string; hash?: string }) {
  if (!b.merchant_oid || !b.status || b.total_amount == null || !b.hash) return false;
  const expected = Buffer.from(hmacB64(cfg.merchantKey, b.merchant_oid + cfg.merchantSalt + b.status + b.total_amount));
  const given = Buffer.from(b.hash);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const PAYTR_FAIL_REASONS: Record<string, string> = {
  "0": "Ödeme onaylanmadı.",
  "1": "Kimlik doğrulama adımında telefon numarası girilmedi.",
  "2": "SMS doğrulama şifresi hatalı girildi.",
  "3": "Güvenlik kontrolünden geçilemedi.",
  "6": "Ödeme yarıda bırakıldı ya da süre doldu.",
  "8": "Bu kartla taksit yapılamıyor.",
  "9": "Bu kart için işlem yetkisi yok.",
  "10": "Bu işlem 3D Secure ile yapılmalı.",
  "11": "Güvenlik nedeniyle işlem reddedildi.",
  "99": "Teknik bir hata oluştu.",
};
