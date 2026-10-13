"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { one, q, tx } from "@/lib/db";
import { deleteImage, saveImage } from "@/lib/images";
import { bool, num, slugify, str } from "@/lib/utils";
import type { FormState } from "./auth";

const done = (path: string, msg = "Kaydedildi"): never => {
  revalidatePath("/", "layout");
  redirect(`${path}${path.includes("?") ? "&" : "?"}ok=${encodeURIComponent(msg)}`);
};

async function uniqueSlug(table: string, base: string, id?: number | null) {
  let s = base || "icerik";
  for (let i = 2; ; i++) {
    const r = await one(`SELECT 1 FROM ${table} WHERE slug = $1 ${id ? "AND id <> $2" : ""}`, id ? [s, id] : [s]);
    if (!r) return s;
    s = `${base}-${i}`;
  }
}

/** Görsel alanını işler: yeni dosya varsa kaydeder, "kaldır" işaretliyse siler. */
async function handleImage(fd: FormData, field: string, current: string | null) {
  const file = fd.get(field);
  const newId = await saveImage(file);
  if (newId) {
    await deleteImage(current);
    return newId;
  }
  if (bool(fd, `${field}_remove`)) {
    await deleteImage(current);
    return null;
  }
  return current;
}

function wrap(fn: (fd: FormData) => Promise<void>) {
  return async (_: FormState, fd: FormData): Promise<FormState> => {
    await requireAdmin();
    try {
      await fn(fd);
    } catch (e: any) {
      unstable_rethrow(e);
      return { error: e?.message || "İşlem başarısız oldu." };
    }
    return { ok: "Kaydedildi" };
  };
}

/* ───────────── İlanlar ───────────── */
export const saveListing = wrap(async (fd) => {
  const id = num(fd, "id");
  const title = str(fd, "title");
  const price = num(fd, "price");
  const oldPrice = num(fd, "old_price");
  if (title.length < 3) throw new Error("Başlık en az 3 karakter olmalı.");
  if (price == null || price < 0) throw new Error("Geçerli bir satış fiyatı yaz.");
  if (oldPrice != null && oldPrice <= price) throw new Error("İndirim göstermek için eski fiyat, satış fiyatından yüksek olmalı. İndirim istemiyorsan boş bırak.");
  const slug = await uniqueSlug("listings", slugify(str(fd, "slug") || title), id);
  const cur = id ? await one<{ cover_image_id: string | null }>("SELECT cover_image_id FROM listings WHERE id = $1", [id]) : null;
  const cover = await handleImage(fd, "cover", cur?.cover_image_id ?? null);
  const vals = [
    title,
    slug,
    num(fd, "category_id"),
    str(fd, "description"),
    price,
    oldPrice,
    cover,
    str(fd, "delivery_type") === "manual" ? "manual" : "auto",
    Math.max(0, Math.floor(num(fd, "manual_stock") ?? 0)),
    bool(fd, "active"),
    bool(fd, "featured"),
  ];
  let lid = id;
  if (id) {
    await q(
      `UPDATE listings SET title=$1, slug=$2, category_id=$3, description=$4, price=$5, old_price=$6, cover_image_id=$7, delivery_type=$8, manual_stock=$9, active=$10, featured=$11 WHERE id=$12`,
      [...vals, id],
    );
  } else {
    const r = await q<{ id: number }>(
      `INSERT INTO listings (title, slug, category_id, description, price, old_price, cover_image_id, delivery_type, manual_stock, active, featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      vals,
    );
    lid = r[0].id;
  }
  const codes = str(fd, "codes")
    .split(/\r?\n/)
    .map((c) => c.trim())
    .filter(Boolean);
  for (const c of codes) await q("INSERT INTO stock_codes (listing_id, code) VALUES ($1,$2)", [lid, c.slice(0, 2000)]);
  done(`/admin/ilanlar/${lid}`, codes.length ? `Kaydedildi, ${codes.length} kod stoğa eklendi` : "Kaydedildi");
});

export async function deleteListing(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const l = await one<{ cover_image_id: string | null }>("SELECT cover_image_id FROM listings WHERE id = $1", [id]);
  const sold = await one("SELECT 1 FROM order_items WHERE listing_id = $1 LIMIT 1", [id]);
  if (sold) {
    await q("UPDATE listings SET active = false WHERE id = $1", [id]);
    done("/admin/ilanlar", "İlanın satış geçmişi olduğu için pasife alındı");
  }
  await q("DELETE FROM listings WHERE id = $1", [id]);
  await deleteImage(l?.cover_image_id);
  done("/admin/ilanlar", "İlan silindi");
}

export async function deleteStockCode(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("code_id"));
  const lid = Number(fd.get("listing_id"));
  await q("DELETE FROM stock_codes WHERE id = $1 AND order_item_id IS NULL", [id]);
  revalidatePath(`/admin/ilanlar/${lid}`);
}

export async function quickToggleListing(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const field = str(fd, "field") === "featured" ? "featured" : "active";
  await q(`UPDATE listings SET ${field} = NOT ${field} WHERE id = $1`, [id]);
  revalidatePath("/", "layout");
}

/* ───────────── Kategoriler ───────────── */
export const saveCategory = wrap(async (fd) => {
  const id = num(fd, "id");
  const name = str(fd, "name");
  if (name.length < 2) throw new Error("Kategori adı gerekli.");
  const slug = await uniqueSlug("categories", slugify(str(fd, "slug") || name), id);
  const cur = id ? await one<{ image_id: string | null }>("SELECT image_id FROM categories WHERE id = $1", [id]) : null;
  const image = await handleImage(fd, "image", cur?.image_id ?? null);
  const color = /^#[0-9a-fA-F]{6}$/.test(str(fd, "color")) ? str(fd, "color") : "#FF6A13";
  const vals = [name, slug, str(fd, "description"), str(fd, "icon") || "Gamepad2", color, image, Math.floor(num(fd, "sort") ?? 0), bool(fd, "active"), bool(fd, "show_in_bar")];
  if (id) await q("UPDATE categories SET name=$1, slug=$2, description=$3, icon=$4, color=$5, image_id=$6, sort=$7, active=$8, show_in_bar=$9 WHERE id=$10", [...vals, id]);
  else await q("INSERT INTO categories (name, slug, description, icon, color, image_id, sort, active, show_in_bar) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", vals);
  done("/admin/kategoriler");
});

export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const c = await one<{ image_id: string | null }>("SELECT image_id FROM categories WHERE id = $1", [id]);
  await q("DELETE FROM categories WHERE id = $1", [id]);
  await deleteImage(c?.image_id);
  done("/admin/kategoriler", "Kategori silindi, ilanları kategorisiz kaldı");
}

/* ───────────── Bannerlar ───────────── */
export const saveBanner = wrap(async (fd) => {
  const id = num(fd, "id");
  const title = str(fd, "title");
  if (title.length < 2) throw new Error("Banner başlığı gerekli.");
  const cur = id ? await one<{ image_id: string | null }>("SELECT image_id FROM banners WHERE id = $1", [id]) : null;
  const image = await handleImage(fd, "image", cur?.image_id ?? null);
  const vals = [title, str(fd, "subtitle"), str(fd, "cta_text") || "Hemen al", str(fd, "cta_link") || "/ilanlar", str(fd, "label"), str(fd, "theme") || "ember", image, Math.floor(num(fd, "sort") ?? 0), bool(fd, "active")];
  if (id) await q("UPDATE banners SET title=$1, subtitle=$2, cta_text=$3, cta_link=$4, label=$5, theme=$6, image_id=$7, sort=$8, active=$9 WHERE id=$10", [...vals, id]);
  else await q("INSERT INTO banners (title, subtitle, cta_text, cta_link, label, theme, image_id, sort, active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", vals);
  done("/admin/bannerlar");
});

export async function deleteBanner(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const b = await one<{ image_id: string | null }>("SELECT image_id FROM banners WHERE id = $1", [id]);
  await q("DELETE FROM banners WHERE id = $1", [id]);
  await deleteImage(b?.image_id);
  done("/admin/bannerlar", "Banner silindi");
}

/* ───────────── Duyurular ───────────── */
export const saveAnnouncement = wrap(async (fd) => {
  const id = num(fd, "id");
  const title = str(fd, "title");
  if (title.length < 3) throw new Error("Duyuru başlığı gerekli.");
  const vals = [title, str(fd, "content"), str(fd, "kind") || "info", str(fd, "link"), bool(fd, "in_ticker"), bool(fd, "active")];
  if (id) await q("UPDATE announcements SET title=$1, content=$2, kind=$3, link=$4, in_ticker=$5, active=$6 WHERE id=$7", [...vals, id]);
  else await q("INSERT INTO announcements (title, content, kind, link, in_ticker, active) VALUES ($1,$2,$3,$4,$5,$6)", vals);
  done("/admin/duyurular");
});

export async function deleteAnnouncement(fd: FormData) {
  await requireAdmin();
  await q("DELETE FROM announcements WHERE id = $1", [Number(fd.get("id"))]);
  done("/admin/duyurular", "Duyuru silindi");
}

/* ───────────── Blog ───────────── */
export const savePost = wrap(async (fd) => {
  const id = num(fd, "id");
  const title = str(fd, "title");
  if (title.length < 3) throw new Error("Yazı başlığı gerekli.");
  const slug = await uniqueSlug("blog_posts", slugify(str(fd, "slug") || title), id);
  const cur = id ? await one<{ cover_image_id: string | null }>("SELECT cover_image_id FROM blog_posts WHERE id = $1", [id]) : null;
  const cover = await handleImage(fd, "cover", cur?.cover_image_id ?? null);
  const vals = [title, slug, str(fd, "excerpt"), str(fd, "content"), cover, bool(fd, "published")];
  if (id) await q("UPDATE blog_posts SET title=$1, slug=$2, excerpt=$3, content=$4, cover_image_id=$5, published=$6 WHERE id=$7", [...vals, id]);
  else await q("INSERT INTO blog_posts (title, slug, excerpt, content, cover_image_id, published) VALUES ($1,$2,$3,$4,$5,$6)", vals);
  done("/admin/blog");
});

export async function deletePost(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const p = await one<{ cover_image_id: string | null }>("SELECT cover_image_id FROM blog_posts WHERE id = $1", [id]);
  await q("DELETE FROM blog_posts WHERE id = $1", [id]);
  await deleteImage(p?.cover_image_id);
  done("/admin/blog", "Yazı silindi");
}

/* ───────────── Ödeme yöntemleri ───────────── */
export const savePaymentMethod = wrap(async (fd) => {
  const id = num(fd, "id");
  const name = str(fd, "name");
  if (name.length < 2) throw new Error("Yöntem adı gerekli.");
  const vals = [name, str(fd, "kind") || "bank", str(fd, "account_name"), str(fd, "account_no"), str(fd, "instructions"), num(fd, "commission") ?? 0, num(fd, "min_amount") ?? 0, bool(fd, "active"), Math.floor(num(fd, "sort") ?? 0)];
  if (id) await q("UPDATE payment_methods SET name=$1, kind=$2, account_name=$3, account_no=$4, instructions=$5, commission=$6, min_amount=$7, active=$8, sort=$9 WHERE id=$10", [...vals, id]);
  else await q("INSERT INTO payment_methods (name, kind, account_name, account_no, instructions, commission, min_amount, active, sort) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", vals);
  done("/admin/odeme");
});

export async function deletePaymentMethod(fd: FormData) {
  await requireAdmin();
  await q("DELETE FROM payment_methods WHERE id = $1", [Number(fd.get("id"))]);
  done("/admin/odeme", "Ödeme yöntemi silindi");
}

/* ───────────── Site ayarları ───────────── */
const SETTING_KEYS = [
  "site_name", "tagline", "footer_about", "contact_email", "instagram", "discord", "x", "youtube",
  "promo1_title", "promo1_text", "promo1_link", "promo2_title", "promo2_text", "promo2_link", "promo3_title", "promo3_text", "promo3_link",
];

export const saveSettings = wrap(async (fd) => {
  const set = async (k: string, v: string) =>
    q("INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [k, v]);
  for (const k of SETTING_KEYS) if (fd.has(k)) await set(k, str(fd, k));
  for (const [field, key] of [["logo", "logo_image_id"], ["favicon", "favicon_image_id"]]) {
    const cur = await one<{ value: string }>("SELECT value FROM settings WHERE key = $1", [key]);
    const v = await handleImage(fd, field, cur?.value || null);
    await set(key, v ?? "");
  }
  done("/admin/ayarlar", "Site ayarları güncellendi");
});

/* ───────────── Üyeler ───────────── */
export const createUser = wrap(async (fd) => {
  const username = str(fd, "username");
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const role = str(fd, "role") === "admin" ? "admin" : "user";
  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) throw new Error("Kullanıcı adı 3-20 karakter; harf, rakam, _ ve . olabilir.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Geçerli bir e-posta yaz.");
  if (password.length < 6) throw new Error("Şifre en az 6 karakter olmalı.");
  const ex = await one("SELECT 1 FROM users WHERE lower(email) = $1 OR lower(username) = lower($2)", [email, username]);
  if (ex) throw new Error("Bu e-posta veya kullanıcı adı kayıtlı.");
  const r = await q<{ id: number }>("INSERT INTO users (username, email, password_hash, role, balance) VALUES ($1,$2,$3,$4,$5) RETURNING id", [
    username, email, await bcrypt.hash(password, 10), role, Math.max(0, num(fd, "balance") ?? 0),
  ]);
  if ((num(fd, "balance") ?? 0) > 0) await q("INSERT INTO balance_logs (user_id, amount, description) VALUES ($1,$2,'Hesap açılış bakiyesi')", [r[0].id, num(fd, "balance")]);
  done(`/admin/uyeler/${r[0].id}`, role === "admin" ? "Yönetici eklendi" : "Üye eklendi");
});

export const updateUser = wrap(async (fd) => {
  const me = await requireAdmin();
  const id = num(fd, "id")!;
  const role = str(fd, "role") === "admin" ? "admin" : "user";
  const banned = bool(fd, "banned");
  if (id === me.id && (role !== "admin" || banned)) throw new Error("Kendi yönetici yetkini kaldıramaz veya kendini engelleyemezsin.");
  const email = str(fd, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Geçerli bir e-posta yaz.");
  const ex = await one("SELECT 1 FROM users WHERE lower(email) = $1 AND id <> $2", [email, id]);
  if (ex) throw new Error("Bu e-posta başka bir üyede kayıtlı.");
  await q("UPDATE users SET role = $1, banned = $2, email = $3 WHERE id = $4", [role, banned, email, id]);
  const pw = str(fd, "password");
  if (pw) {
    if (pw.length < 6) throw new Error("Yeni şifre en az 6 karakter olmalı.");
    await q("UPDATE users SET password_hash = $1 WHERE id = $2", [await bcrypt.hash(pw, 10), id]);
  }
  done(`/admin/uyeler/${id}`, "Üye güncellendi");
});

export const adjustBalance = wrap(async (fd) => {
  const id = num(fd, "id")!;
  const amount = num(fd, "amount");
  const note = str(fd, "note") || "Yönetici düzenlemesi";
  if (!amount) throw new Error("Tutar yaz. Düşmek için eksi (-) kullan.");
  await tx(async (t) => {
    const [u] = await t<{ balance: number }>("SELECT balance FROM users WHERE id = $1 FOR UPDATE", [id]);
    if (Number(u.balance) + amount < 0) throw new Error("Bakiye eksiye düşemez.");
    await t("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, id]);
    await t("INSERT INTO balance_logs (user_id, amount, description) VALUES ($1,$2,$3)", [id, amount, note]);
  });
  done(`/admin/uyeler/${id}`, "Bakiye güncellendi");
});

/* ───────────── Bakiye talepleri ───────────── */
export async function resolveDeposit(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const approve = str(fd, "decision") === "approve";
  const note = str(fd, "admin_note") || null;
  await tx(async (t) => {
    const [d] = await t<{ user_id: number; amount: number; status: string; method_name: string }>("SELECT * FROM deposits WHERE id = $1 FOR UPDATE", [id]);
    if (!d || d.status !== "pending") return;
    await t("UPDATE deposits SET status = $1, admin_note = $2, resolved_at = now() WHERE id = $3", [approve ? "approved" : "rejected", note, id]);
    if (approve) {
      await t("UPDATE users SET balance = balance + $1 WHERE id = $2", [d.amount, d.user_id]);
      await t("INSERT INTO balance_logs (user_id, amount, description) VALUES ($1,$2,$3)", [d.user_id, d.amount, `Bakiye yükleme (${d.method_name})`]);
    }
  });
  done("/admin/bakiye", approve ? "Ödeme onaylandı, bakiye eklendi" : "Ödeme bildirimi reddedildi");
}

/* ───────────── İadeler ───────────── */
export async function resolveRefund(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const approve = str(fd, "decision") === "approve";
  const note = str(fd, "admin_note") || null;
  await tx(async (t) => {
    const [r] = await t<{ order_item_id: number; user_id: number; status: string }>("SELECT * FROM refund_requests WHERE id = $1 FOR UPDATE", [id]);
    if (!r || r.status !== "pending") return;
    await t("UPDATE refund_requests SET status = $1, admin_note = $2, resolved_at = now() WHERE id = $3", [approve ? "approved" : "rejected", note, id]);
    if (approve) {
      const [it] = await t<{ unit_price: number; quantity: number; order_id: number; status: string; title: string }>("SELECT * FROM order_items WHERE id = $1 FOR UPDATE", [r.order_item_id]);
      if (it.status === "refunded") return;
      const amount = Number(it.unit_price) * it.quantity;
      await t("UPDATE order_items SET status = 'refunded' WHERE id = $1", [r.order_item_id]);
      await t("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, r.user_id]);
      await t("INSERT INTO balance_logs (user_id, amount, description) VALUES ($1,$2,$3)", [r.user_id, amount, `İade: ${it.title} (#${it.order_id})`]);
    }
  });
  done("/admin/iadeler", approve ? "İade onaylandı, tutar bakiyeye eklendi" : "İade reddedildi");
}

/* ───────────── Siparişler (manuel teslim) ───────────── */
export async function deliverItem(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const content = str(fd, "content");
  if (!content) done("/admin/siparisler?durum=pending", "Teslim içeriği boş olamaz");
  await q("UPDATE order_items SET status = 'delivered', delivered_content = $1, delivered_at = now() WHERE id = $2 AND status = 'pending'", [content, id]);
  done("/admin/siparisler?durum=pending", "Ürün teslim edildi");
}

/* ───────────── Destek ───────────── */
export const staffReply = wrap(async (fd) => {
  const me = await requireAdmin();
  const id = num(fd, "ticket_id")!;
  const message = str(fd, "message");
  const status = ["open", "answered", "closed"].includes(str(fd, "status")) ? str(fd, "status") : "answered";
  if (message) await q("INSERT INTO ticket_messages (ticket_id, user_id, is_staff, message) VALUES ($1,$2,true,$3)", [id, me.id, message]);
  await q("UPDATE tickets SET status = $1, updated_at = now() WHERE id = $2", [status, id]);
  done(`/admin/destek/${id}`, message ? "Yanıt gönderildi" : "Durum güncellendi");
});
