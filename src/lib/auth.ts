import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import { createHash } from "crypto";
import { cache } from "react";
import { one } from "./db";
import { databaseUrl } from "./env";

const COOKIE = "ep_session";
const MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Oturum anahtarı. AUTH_SECRET girilmemişse herkese açık bir sabit yerine veritabanı adresinden
 * türetilir: tüm sunucu kopyalarında aynıdır ama kimse tahmin edemez.
 */
function secret() {
  const s = process.env.AUTH_SECRET?.trim();
  if (s && s.length >= 16) return new TextEncoder().encode(s);
  const db = databaseUrl();
  if (db) return new TextEncoder().encode(createHash("sha256").update(`epicpin-session:${db}`).digest("hex"));
  return new TextEncoder().encode("epicpin-local-development-secret");
}

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  balance: number;
  banned: boolean;
  created_at: string;
  session_version: number;
};

export async function createSession(userId: number, sessionVersion = 1) {
  const token = await new SignJWT({ uid: userId, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

/**
 * Oturumdaki kullanıcı. Geçersiz/süresi dolmuş oturum null döner.
 * Veritabanı hatası ise kullanıcıyı sessizce çıkış yapmış gibi göstermek yerine hata fırlatılır.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  let payload: { uid?: unknown; sv?: unknown };
  try {
    ({ payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] }));
  } catch (e) {
    if (e instanceof joseErrors.JOSEError) return null;
    throw e;
  }
  const uid = Number(payload.uid);
  if (!Number.isInteger(uid) || uid <= 0) return null;
  const u = await one<SessionUser>(
    "SELECT id, username, email, role, balance, banned, created_at, session_version FROM users WHERE id = $1",
    [uid],
  );
  if (!u || u.banned) return null;
  if ((Number(payload.sv) || 1) !== (u.session_version ?? 1)) return null;
  return u;
});

export async function requireUser(next?: string) {
  const u = await getUser();
  if (!u) redirect(`/giris${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return u;
}

export async function requireAdmin() {
  const u = await getUser();
  if (!u || u.role !== "admin") redirect("/giris?next=/admin");
  return u;
}
