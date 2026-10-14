"use server";
import bcrypt from "bcryptjs";
import { one, q } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { safeNext, str } from "@/lib/utils";

export type FormState = { error?: string; ok?: string; go?: string } | undefined;

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "identifier").toLowerCase();
  const password = str(fd, "password");
  if (!id || !password) return { error: "E-posta/kullanıcı adı ve şifre gerekli." };
  // Kaba kuvvet koruması: 15 dakikada 8 hatalı deneme
  const key = `login:${id}`;
  const att = await one<{ fails: number; fresh: boolean }>(
    "SELECT fails, window_start > now() - interval '15 minutes' AS fresh FROM login_attempts WHERE key = $1",
    [key],
  );
  if (att?.fresh && att.fails >= 8) return { error: "Çok fazla hatalı deneme yaptın. 15 dakika sonra tekrar dene." };
  const u = await one<{ id: number; password_hash: string; banned: boolean; session_version: number }>(
    "SELECT id, password_hash, banned, session_version FROM users WHERE lower(email) = $1 OR lower(username) = $1 ORDER BY (lower(email) = $1) DESC LIMIT 1",
    [id],
  );
  if (!u || !(await bcrypt.compare(password, u.password_hash))) {
    await q(
      `INSERT INTO login_attempts (key, fails, window_start) VALUES ($1, 1, now())
       ON CONFLICT (key) DO UPDATE SET fails = CASE WHEN login_attempts.window_start > now() - interval '15 minutes' THEN login_attempts.fails + 1 ELSE 1 END,
         window_start = CASE WHEN login_attempts.window_start > now() - interval '15 minutes' THEN login_attempts.window_start ELSE now() END`,
      [key],
    );
    return { error: "Bilgiler hatalı. Tekrar dene." };
  }
  await q("DELETE FROM login_attempts WHERE key = $1", [key]);
  if (u.banned) return { error: "Hesabın askıya alınmış. Destek ekibiyle iletişime geç." };
  await createSession(u.id, u.session_version ?? 1);
  // Tam sayfa yenilemeyle gidilir: başlık, sepet ve tüm sayfa kesin olarak yeni oturumla açılır
  return { ok: "Giriş yapıldı, yönlendiriliyorsun.", go: safeNext(str(fd, "next")) };
}

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const username = str(fd, "username");
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) return { error: "Kullanıcı adı 3-20 karakter olmalı; harf, rakam, _ ve . kullanabilirsin." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Geçerli bir e-posta adresi yaz." };
  if (password.length < 6) return { error: "Şifre en az 6 karakter olmalı." };
  if (!fd.get("terms")) return { error: "Devam etmek için kullanım koşullarını onayla." };
  const exists = await one("SELECT 1 FROM users WHERE lower(email) = $1 OR lower(username) = lower($2)", [email, username]);
  if (exists) return { error: "Bu e-posta ya da kullanıcı adı zaten kayıtlı." };
  if (email.length > 100) return { error: "E-posta adresi çok uzun." };
  let r: { id: number }[];
  try {
    r = await q<{ id: number }>("INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id", [
      username,
      email,
      await bcrypt.hash(password, 10),
    ]);
  } catch (e: any) {
    if (e?.code === "23505") return { error: "Bu e-posta ya da kullanıcı adı zaten kayıtlı." };
    throw e;
  }
  await createSession(r[0].id, 1);
  return { ok: "Hesabın oluşturuldu, yönlendiriliyorsun.", go: safeNext(str(fd, "next")) };
}

export async function logoutAction() {
  await destroySession();
  return { ok: "Çıkış yapıldı", go: "/" };
}

/* ───────────── Hesap ayarları ve şifre sıfırlama ───────────── */
async function siteOrigin() {
  const { headers } = await import("next/headers");
  const h = await headers();
  return (process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`).replace(/\/$/, "");
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const { getUser } = await import("@/lib/auth");
  const me = await getUser();
  if (!me) return { error: "Oturumun kapanmış, tekrar giriş yap." };
  const current = str(fd, "current");
  const next = str(fd, "password");
  if (next.length < 6) return { error: "Yeni şifre en az 6 karakter olmalı." };
  if (next !== str(fd, "password2")) return { error: "Yeni şifreler birbirini tutmuyor." };
  const u = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [me.id]);
  if (!u || !(await bcrypt.compare(current, u.password_hash))) return { error: "Mevcut şifren hatalı." };
  const [r] = await q<{ session_version: number }>(
    "UPDATE users SET password_hash = $1, session_version = session_version + 1 WHERE id = $2 RETURNING session_version",
    [await bcrypt.hash(next, 10), me.id],
  );
  await createSession(me.id, r.session_version);
  return { ok: "Şifren değişti. Diğer cihazlardaki oturumların kapatıldı." };
}

export async function changeEmailAction(_: FormState, fd: FormData): Promise<FormState> {
  const { getUser } = await import("@/lib/auth");
  const me = await getUser();
  if (!me) return { error: "Oturumun kapanmış, tekrar giriş yap." };
  const email = str(fd, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) return { error: "Geçerli bir e-posta adresi yaz." };
  const u = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [me.id]);
  if (!u || !(await bcrypt.compare(str(fd, "current"), u.password_hash))) return { error: "Şifren hatalı." };
  const ex = await one("SELECT 1 FROM users WHERE lower(email) = $1 AND id <> $2", [email, me.id]);
  if (ex) return { error: "Bu e-posta başka bir hesapta kayıtlı." };
  await q("UPDATE users SET email = $1 WHERE id = $2", [email, me.id]);
  return { ok: "E-posta adresin güncellendi." };
}

export async function forgotPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Geçerli bir e-posta adresi yaz." };
  const { mailConfigured, sendMail } = await import("@/lib/mail");
  const rows = await q<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key LIKE 'smtp%' OR key = 'site_name'");
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  if (!mailConfigured(s)) return { error: "Şifre sıfırlama e-postası şu an gönderilemiyor. Destek ekibine yaz, hesabını doğrulayıp yardımcı olalım." };
  // Kaba kuvvet / spam koruması: aynı adrese 15 dakikada en fazla 3 istek
  const key = `reset:${email}`;
  const att = await one<{ fails: number; fresh: boolean }>("SELECT fails, window_start > now() - interval '15 minutes' AS fresh FROM login_attempts WHERE key = $1", [key]);
  if (att?.fresh && att.fails >= 3) return { ok: "Bu adres kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutunu ve spam klasörünü kontrol et." };
  await q(
    `INSERT INTO login_attempts (key, fails, window_start) VALUES ($1, 1, now())
     ON CONFLICT (key) DO UPDATE SET fails = CASE WHEN login_attempts.window_start > now() - interval '15 minutes' THEN login_attempts.fails + 1 ELSE 1 END,
       window_start = CASE WHEN login_attempts.window_start > now() - interval '15 minutes' THEN login_attempts.window_start ELSE now() END`,
    [key],
  );
  const u = await one<{ id: number; username: string }>("SELECT id, username FROM users WHERE lower(email) = $1 AND NOT banned", [email]);
  if (u) {
    const { randomBytes, createHash } = await import("crypto");
    const token = randomBytes(32).toString("base64url");
    await q("INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ($1,$2, now() + interval '1 hour')", [
      createHash("sha256").update(token).digest("hex"),
      u.id,
    ]);
    const link = `${await siteOrigin()}/sifre-sifirla?t=${token}`;
    try {
      await sendMail(
        email,
        `${s.site_name || "EpicPin"} şifre sıfırlama`,
        "Şifreni sıfırla",
        `<p style="color:#d9d1dc;line-height:1.6">Merhaba ${u.username}, şifreni sıfırlamak için aşağıdaki butona tıkla. Bağlantı 1 saat geçerli.</p>
         <p style="margin:24px 0"><a href="${link}" style="background:#FF6A13;color:#0A090C;padding:12px 20px;border-radius:10px;font-weight:700;text-decoration:none">Yeni şifre belirle</a></p>
         <p style="color:#A096A8;font-size:12px">Bu isteği sen yapmadıysan e-postayı yok sayabilirsin.</p>`,
        `Şifreni sıfırlamak için: ${link} (1 saat geçerli)`,
      );
    } catch (e) {
      console.error("[EpicPin] Şifre sıfırlama e-postası gönderilemedi:", e);
      return { error: "E-posta gönderilemedi. Biraz sonra tekrar dene ya da destek ekibine yaz." };
    }
  }
  return { ok: "Bu adres kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutunu ve spam klasörünü kontrol et." };
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const token = str(fd, "t");
  const pw = str(fd, "password");
  if (pw.length < 6) return { error: "Şifre en az 6 karakter olmalı." };
  if (pw !== str(fd, "password2")) return { error: "Şifreler birbirini tutmuyor." };
  const { createHash } = await import("crypto");
  const hash = createHash("sha256").update(token).digest("hex");
  const r = await one<{ user_id: number }>(
    "UPDATE password_resets SET used = true WHERE token_hash = $1 AND NOT used AND expires_at > now() RETURNING user_id",
    [hash],
  );
  if (!r) return { error: "Bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeni bir bağlantı iste." };
  const [u] = await q<{ session_version: number }>(
    "UPDATE users SET password_hash = $1, session_version = session_version + 1 WHERE id = $2 RETURNING session_version",
    [await bcrypt.hash(pw, 10), r.user_id],
  );
  await q("DELETE FROM login_attempts WHERE key LIKE 'login:%' AND key IN (SELECT 'login:' || lower(email) FROM users WHERE id = $1)", [r.user_id]);
  await createSession(r.user_id, u.session_version);
  return { ok: "Yeni şifren kaydedildi.", go: "/hesabim?sifre=1" };
}
