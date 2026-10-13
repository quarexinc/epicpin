import { getUser } from "@/lib/auth";
import { q } from "@/lib/db";

const esc = (v: unknown) => {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Siparişleri veya üyeleri Excel'de açılabilen CSV olarak indirir. */
export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const u = await getUser();
  if (!u || u.role !== "admin") return new Response("Yetkisiz", { status: 401 });
  const { type } = await params;
  let rows: Record<string, unknown>[] = [];
  if (type === "siparisler")
    rows = await q(`SELECT o.id AS siparis, to_char(o.created_at, 'YYYY-MM-DD HH24:MI') AS tarih, u.username AS uye, u.email, oi.title AS urun, oi.quantity AS adet,
      oi.unit_price AS birim_fiyat, oi.unit_price * oi.quantity AS tutar, o.discount AS siparis_indirimi, o.coupon_code AS kupon, oi.status AS durum
      FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN users u ON u.id = o.user_id ORDER BY o.id DESC, oi.id`);
  else if (type === "uyeler")
    rows = await q(`SELECT u.id, u.username AS kullanici_adi, u.email, u.role AS yetki, u.balance AS bakiye, u.banned AS askida,
      to_char(u.created_at, 'YYYY-MM-DD HH24:MI') AS kayit, (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS siparis_sayisi,
      (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.user_id = u.id) AS toplam_harcama FROM users u ORDER BY u.id`);
  else return new Response("Bulunamadı", { status: 404 });
  const head = rows[0] ? Object.keys(rows[0]) : [];
  const csv = "﻿" + [head.join(";"), ...rows.map((r) => head.map((h) => esc(r[h])).join(";"))].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="epicpin-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
