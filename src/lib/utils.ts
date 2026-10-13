export function slugify(s: string) {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u" };
  return s
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (c) => map[c] ?? c)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function tl(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}

export function discountPct(price: number, old?: number | null) {
  if (!old || old <= price) return 0;
  return Math.round(((old - price) / old) * 100);
}

export function img(id?: string | null) {
  return id ? `/api/images/${id}` : null;
}

const TZ = "Europe/Istanbul";

export function timeAgo(d: string | Date) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return "az önce";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export function maskName(n: string) {
  return n.length <= 2 ? n[0] + "*" : n.slice(0, 2) + "*".repeat(Math.min(4, n.length - 2));
}

export function safeNext(n?: string | null) {
  return n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/";
}

export function dateTR(d: string | Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
}

export function dateTimeTR(d: string | Date) {
  return new Date(d).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function str(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim();
}

export function num(fd: FormData, k: string) {
  const v = str(fd, k).replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function bool(fd: FormData, k: string) {
  const v = fd.get(k);
  return v === "on" || v === "true" || v === "1";
}

export const STATUS_TR: Record<string, string> = {
  pending: "Bekliyor",
  delivered: "Teslim edildi",
  refunded: "İade edildi",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  cancelled: "İptal edildi",
  open: "Açık",
  answered: "Yanıtlandı",
  customer_reply: "Yanıt bekliyor",
  closed: "Kapandı",
};
