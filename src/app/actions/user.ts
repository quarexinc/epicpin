"use server";
import { revalidatePath } from "next/cache";
import { checkCoupon, performCheckout } from "@/lib/checkout";
import { createCardPayment } from "@/lib/cardFlow";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { one, q, tx } from "@/lib/db";
import { LISTING_SELECT, type Listing } from "@/lib/data";
import { num, str } from "@/lib/utils";
import type { FormState } from "./auth";

export async function toggleFavoriteAction(listingId: number): Promise<"added" | "removed" | "login"> {
  const u = await getUser();
  if (!u) return "login";
  const del = await q("DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2 RETURNING listing_id", [u.id, listingId]);
  if (del.length) {
    revalidatePath("/hesabim/favoriler");
    return "removed";
  }
  await q("INSERT INTO favorites (user_id, listing_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [u.id, listingId]);
  revalidatePath("/hesabim/favoriler");
  return "added";
}

export async function getCartListings(ids: number[]) {
  const clean = ids.filter((i) => Number.isInteger(i)).slice(0, 50);
  if (!clean.length) return [];
  return q<Listing>(`${LISTING_SELECT} WHERE l.id = ANY($1::int[]) AND l.active`, [clean]);
}

export async function previewCouponAction(code: string, items: { id: number; qty: number }[]): Promise<{ ok: true; code: string; discount: number; label: string } | { ok: false; error: string }> {
  const u = await getUser();
  if (!u) return { ok: false, error: "İndirim kodu kullanmak için giriş yap." };
  if (!code.trim()) return { ok: false, error: "Bir kod yaz." };
  const ids = items.map((i) => Math.floor(Number(i.id))).filter((i) => i > 0);
  const rows = ids.length ? await q<{ id: number; price: number }>("SELECT id, price FROM listings WHERE id = ANY($1::int[]) AND active", [ids]) : [];
  const subtotal = Math.round(items.reduce((a, i) => a + (rows.find((r) => r.id === Number(i.id))?.price ?? 0) * Math.max(0, Math.floor(i.qty)), 0) * 100) / 100;
  try {
    const { coupon, discount } = await checkCoupon(q, code, u.id, subtotal);
    return { ok: true, code: coupon.code, discount, label: coupon.kind === "percent" ? `%${Number(coupon.value)} indirim` : `${Number(coupon.value).toFixed(2)} ₺ indirim` };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

type CheckoutResult = { ok: true; orderId: number } | { ok: false; error: string; login?: boolean };

export async function checkoutAction(items: { id: number; qty: number }[], couponCode?: string): Promise<CheckoutResult> {
  const u = await getUser();
  if (!u) return { ok: false, error: "Satın almak için giriş yap.", login: true };
  try {
    return { ok: true, orderId: await performCheckout(u.id, items, couponCode) };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Sipariş oluşturulamadı." };
  }
}

export async function requestRefundAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u) return { error: "Giriş yapmalısın." };
  const itemId = Number(fd.get("item_id"));
  const reason = str(fd, "reason");
  if (reason.length < 10) return { error: "İade nedenini en az 10 karakterle açıkla." };
  const item = await one<{ id: number; status: string }>(
    "SELECT oi.id, oi.status FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.id = $1 AND o.user_id = $2",
    [itemId, u.id],
  );
  if (!item) return { error: "Sipariş bulunamadı." };
  if (item.status === "refunded") return { error: "Bu ürün zaten iade edildi." };
  const open = await one("SELECT 1 FROM refund_requests WHERE order_item_id = $1 AND status = 'pending'", [itemId]);
  if (open) return { error: "Bu ürün için bekleyen bir iade talebin var." };
  await q("INSERT INTO refund_requests (order_item_id, user_id, reason) VALUES ($1,$2,$3)", [itemId, u.id, reason]);
  revalidatePath("/hesabim", "layout");
  return { ok: "İade talebin alındı. Ekibimiz en kısa sürede inceleyecek." };
}

export async function createDepositAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u) return { error: "Giriş yapmalısın." };
  const methodId = Number(fd.get("method_id"));
  const amount = num(fd, "amount");
  const sender = str(fd, "sender_name");
  const m = await one<{ id: number; name: string; min_amount: number; active: boolean }>("SELECT * FROM payment_methods WHERE id = $1", [methodId]);
  if (!m || !m.active) return { error: "Bir ödeme yöntemi seç." };
  if ((m as any).kind === "paytr") return { error: "Kartla ödeme için Kartla öde butonunu kullan." };
  if (!amount || amount <= 0) return { error: "Geçerli bir tutar yaz." };
  if (amount < Number(m.min_amount)) return { error: `Bu yöntem için en az ${Number(m.min_amount).toFixed(2)} ₺ yükleyebilirsin.` };
  if (amount > 100000) return { error: "Tek seferde en fazla 100.000 ₺ yükleyebilirsin." };
  if (sender.length < 3) return { error: "Gönderen ad soyad bilgisini yaz." };
  const pending = await one<{ c: number }>("SELECT COUNT(*)::int AS c FROM deposits WHERE user_id = $1 AND status = 'pending'", [u.id]);
  if ((pending?.c ?? 0) >= 3) return { error: "Onay bekleyen 3 bildirimin var. Onaylanmalarını bekle." };
  await q("INSERT INTO deposits (user_id, method_id, method_name, amount, sender_name, note) VALUES ($1,$2,$3,$4,$5,$6)", [
    u.id,
    m.id,
    m.name,
    amount,
    sender,
    str(fd, "note").slice(0, 500),
  ]);
  revalidatePath("/bakiye-yukle");
  return { ok: "Ödeme bildirimin alındı. Onaylandığında bakiyene eklenecek." };
}

export async function createTicketAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u) return { error: "Giriş yapmalısın." };
  const subject = str(fd, "subject");
  const message = str(fd, "message");
  const topic = str(fd, "topic") || "genel";
  const orderId = num(fd, "order_id");
  if (subject.length < 4) return { error: "Konu en az 4 karakter olmalı." };
  if (message.length < 10) return { error: "Mesajın en az 10 karakter olmalı." };
  const id = await tx(async (t) => {
    const [tk] = await t<{ id: number }>("INSERT INTO tickets (user_id, subject, topic, order_id) VALUES ($1,$2,$3,$4) RETURNING id", [
      u.id,
      subject.slice(0, 150),
      topic,
      orderId,
    ]);
    await t("INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES ($1,$2,$3)", [tk.id, u.id, message.slice(0, 5000)]);
    return tk.id;
  });
  redirect(`/destek/${id}`);
}

export async function replyTicketAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u) return { error: "Giriş yapmalısın." };
  const id = Number(fd.get("ticket_id"));
  const message = str(fd, "message");
  if (message.length < 2) return { error: "Mesaj yaz." };
  const t = await one<{ status: string }>("SELECT status FROM tickets WHERE id = $1 AND user_id = $2", [id, u.id]);
  if (!t) return { error: "Talep bulunamadı." };
  if (t.status === "closed") return { error: "Bu talep kapatıldı. Yeni bir talep açabilirsin." };
  await q("INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES ($1,$2,$3)", [id, u.id, message.slice(0, 5000)]);
  await q("UPDATE tickets SET status = 'customer_reply', updated_at = now() WHERE id = $1", [id]);
  revalidatePath(`/destek/${id}`);
  return { ok: "Mesajın gönderildi." };
}

export async function closeTicketAction(fd: FormData) {
  const u = await getUser();
  if (!u) return;
  const id = Number(fd.get("ticket_id"));
  await q("UPDATE tickets SET status = 'closed', updated_at = now() WHERE id = $1 AND user_id = $2", [id, u.id]);
  revalidatePath(`/destek/${id}`);
}

/* ───────────── Kartla ödeme (PayTR) ───────────── */
async function requestContext() {
  const h = await headers();
  // Vercel müşterinin gerçek IP'sini x-real-ip ile verir; diğer barındırmalarda x-forwarded-for'un ilk adresi kullanılır
  const ip = (h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1").trim();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`).replace(/\/$/, "");
  return { ip, origin };
}

export async function startCardDepositAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u) return { error: "Giriş yapmalısın." };
  let id: number;
  try {
    id = await createCardPayment(u, await requestContext(), {
      kind: "deposit",
      amount: num(fd, "amount") ?? 0,
      buyer: { name: str(fd, "buyer_name"), phone: str(fd, "buyer_phone") },
    });
  } catch (e: any) {
    return { error: e?.message || "Ödeme başlatılamadı." };
  }
  redirect(`/odeme/kart/${id}`);
}

export async function startCardCartAction(
  items: { id: number; qty: number }[],
  coupon: string | null,
  buyer: { name: string; phone: string },
): Promise<{ ok: true; id: number } | { ok: false; error: string; login?: boolean }> {
  const u = await getUser();
  if (!u) return { ok: false, error: "Satın almak için giriş yap.", login: true };
  try {
    return { ok: true, id: await createCardPayment(u, await requestContext(), { kind: "cart", items, coupon, buyer }) };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Ödeme başlatılamadı." };
  }
}
