import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { one } from "./db";

const COOKIE = "ep_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "epicpin-dev-secret-change-me-in-production");

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  balance: number;
  banned: boolean;
  created_at: string;
};

export async function createSession(userId: number) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const u = await one<SessionUser>(
      "SELECT id, username, email, role, balance, banned, created_at FROM users WHERE id = $1",
      [payload.uid],
    );
    if (!u || u.banned) return null;
    return u;
  } catch {
    return null;
  }
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
