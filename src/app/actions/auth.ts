"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { one, q } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { str } from "@/lib/utils";

export type FormState = { error?: string; ok?: string } | undefined;

function safeNext(n: string) {
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "identifier").toLowerCase();
  const password = str(fd, "password");
  if (!id || !password) return { error: "E-posta/kullanıcı adı ve şifre gerekli." };
  const u = await one<{ id: number; password_hash: string; banned: boolean }>(
    "SELECT id, password_hash, banned FROM users WHERE lower(email) = $1 OR lower(username) = $1",
    [id],
  );
  if (!u || !(await bcrypt.compare(password, u.password_hash))) return { error: "Bilgiler hatalı. Tekrar dene." };
  if (u.banned) return { error: "Hesabın askıya alınmış. Destek ekibiyle iletişime geç." };
  await createSession(u.id);
  redirect(safeNext(str(fd, "next")));
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
  const r = await q<{ id: number }>("INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id", [
    username,
    email,
    await bcrypt.hash(password, 10),
  ]);
  await createSession(r[0].id);
  redirect(safeNext(str(fd, "next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
