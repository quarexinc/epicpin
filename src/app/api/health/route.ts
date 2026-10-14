import { q } from "@/lib/db";
import { databaseUrl, isServerless } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Kurulum kontrolü: veritabanı bağlantısını ve temel ayarları gösterir (gizli bilgi içermez). */
export async function GET() {
  const out: Record<string, unknown> = {
    database_configured: !!databaseUrl() || !isServerless(),
    auth_secret_set: !!process.env.AUTH_SECRET,
    serverless: isServerless(),
  };
  try {
    const t0 = Date.now();
    const [v] = await q<{ value: string }>("SELECT value FROM settings WHERE key = 'schema_version'");
    const [u] = await q<{ c: number }>("SELECT COUNT(*)::int AS c FROM users");
    out.database = "ok";
    out.latency_ms = Date.now() - t0;
    out.schema_version = v?.value ?? null;
    out.users = u.c;
  } catch (e: any) {
    out.database = "error";
    out.error = String(e?.message ?? e).slice(0, 300);
  }
  return Response.json(out, { status: out.database === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
