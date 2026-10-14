import "server-only";
import { HARDENING_SQL, MIGRATIONS_SQL, PAYMENT_SQL, SCHEMA_SQL } from "./schema";
import { seedDatabase, seedExtras } from "./seed";
import { databaseUrl, isServerless } from "./env";

const SCHEMA_VERSION = "6";

type Row = Record<string, any>;
export type Q = <T = Row>(text: string, params?: unknown[]) => Promise<T[]>;

interface Driver {
  query: Q;
  transaction: <T>(fn: (q: Q) => Promise<T>) => Promise<T>;
  exec: (sql: string) => Promise<void>;
  kind: "postgres" | "pglite";
}

export class DbNotConfiguredError extends Error {
  constructor() {
    super("Veritabanı bağlı değil. Vercel > Storage bölümünden bir Postgres (Neon) veritabanı bağlayıp yeniden deploy et.");
  }
}

const g = globalThis as unknown as { __epicDriver?: Promise<Driver>; __epicReady?: Promise<void> };

/**
 * Bağlantı adresini sürücüye uygun hale getirir. Neon'un adreslerindeki channel_binding gibi
 * libpq'ya özgü parametreler sürücüde "unrecognized configuration parameter" hatası verdiği için atılır;
 * SSL ayarı sslmode'dan okunur.
 */
export function normalizeDbUrl(raw: string) {
  const u = new URL(raw.replace(/^postgresql:/i, "postgres:"));
  const sslmode = (u.searchParams.get("sslmode") || "").toLowerCase();
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(u.hostname);
  const ssl = sslmode === "disable" || (local && sslmode !== "require") ? false : ("require" as const);
  u.search = "";
  return { url: u.toString(), ssl };
}

const TRANSIENT = new Set([
  "ECONNRESET", "ETIMEDOUT", "EPIPE", "ECONNREFUSED", "EAI_AGAIN",
  "CONNECTION_CLOSED", "CONNECTION_ENDED", "CONNECTION_DESTROYED", "CONNECT_TIMEOUT",
  "57P01", "57P02", "57P03", "08000", "08001", "08003", "08006",
]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function createDriver(): Promise<Driver> {
  const raw = databaseUrl();
  if (raw) {
    const postgres = (await import("postgres")).default;
    const { url, ssl } = normalizeDbUrl(raw);
    const sql = postgres(url, {
      max: isServerless() ? 3 : 8,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
      connect_timeout: 15,
      prepare: false, // havuzlu (pgbouncer) bağlantılarla uyumlu
      ssl,
      onnotice: () => {},
      // NUMERIC ve BIGINT değerleri metin yerine sayı olarak gelsin (para ve sayaçlar)
      types: {
        numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
        int8: { to: 20, from: [20], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
      } as any,
    });
    // Bağlantı kopması / uyuyan veritabanının uyanması gibi geçici hatalarda tekrar dener
    const query: Q = async (text, params = []) => {
      for (let i = 0; ; i++) {
        try {
          return (await sql.unsafe(text, params as any[])) as any;
        } catch (e: any) {
          if (i >= 2 || !TRANSIENT.has(e?.code)) throw e;
          await sleep(250 * (i + 1));
        }
      }
    };
    return {
      kind: "postgres",
      query,
      exec: async (s) => {
        await sql.unsafe(s);
      },
      transaction: async (fn) =>
        (await sql.begin(async (t) => fn(async (text, params = []) => (await t.unsafe(text, params as any[])) as any))) as any,
    };
  }
  // Sunucusuz ortamda (Vercel) gömülü veritabanı her kopyada ayrı ve geçici olur; kullanıcılar kaybolur.
  if (isServerless()) throw new DbNotConfiguredError();

  // Yerel geliştirme: gömülü Postgres (PGlite), veriler .data klasöründe kalıcı
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("fs");
  mkdirSync("./.data", { recursive: true });
  const db = new PGlite("./.data/pglite");
  await db.exec("SET TIME ZONE 'Europe/Istanbul'");
  const fixNum = (rows: Row[], fields: { name: string; dataTypeID: number }[]) => {
    const nums = fields.filter((f) => f.dataTypeID === 1700 || f.dataTypeID === 20).map((f) => f.name);
    if (nums.length) for (const r of rows) for (const n of nums) if (r[n] != null) r[n] = Number(r[n]);
    return rows;
  };
  let chain = Promise.resolve();
  const query: Q = async (text, params = []) => {
    const res = await db.query<Row>(text, params as any[]);
    return fixNum(res.rows, res.fields) as any;
  };
  return {
    kind: "pglite",
    query,
    exec: async (s) => {
      await db.exec(s);
    },
    transaction: <T,>(fn: (q: Q) => Promise<T>) => {
      // PGlite tek bağlantılı: işlemleri sıraya al
      const run = chain.then(() =>
        db.transaction(async (t) =>
          fn(async (text, params = []) => {
            const r = await t.query<Row>(text, params as any[]);
            return fixNum(r.rows, r.fields) as any;
          }),
        ),
      );
      chain = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  };
}

async function driver(): Promise<Driver> {
  if (!g.__epicDriver)
    g.__epicDriver = createDriver().catch((e) => {
      g.__epicDriver = undefined;
      throw e;
    });
  const d = await g.__epicDriver;
  if (!g.__epicReady) {
    g.__epicReady = (async () => {
      // Şema güncelse soğuk açılışta tek sorguyla geç
      const [t] = await d.query<{ ok: boolean }>("SELECT to_regclass('public.settings') IS NOT NULL AS ok");
      if (t.ok) {
        const v = await d.query<{ value: string }>("SELECT value FROM settings WHERE key = 'schema_version'");
        if (v[0]?.value === SCHEMA_VERSION) return;
      }
      await d.transaction(async (q) => {
        // Aynı anda açılan sunucular şemayı birlikte kurmaya çalışmasın
        await q("SELECT pg_advisory_xact_lock(7340211)");
        // Başka bir sunucu kopyası kurulumu az önce bitirmiş olabilir (hata üretmeden kontrol et)
        const [t] = await q<{ ok: boolean }>("SELECT to_regclass('public.settings') IS NOT NULL AS ok");
        if (t.ok) {
          const v = await q<{ value: string }>("SELECT value FROM settings WHERE key = 'schema_version'");
          if (v[0]?.value === SCHEMA_VERSION) return;
        }
        for (const stmt of (SCHEMA_SQL + MIGRATIONS_SQL + PAYMENT_SQL + HARDENING_SQL).split(";").map((x) => x.trim()).filter(Boolean)) await q(stmt);
        const r = await q<{ c: number }>("SELECT COUNT(*)::int AS c FROM users");
        if (r[0].c === 0) await seedDatabase(q);
        await seedExtras(q);
        await q(
          "INSERT INTO settings (key, value) VALUES ('schema_version', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
          [SCHEMA_VERSION],
        );
      });
    })().catch((e) => {
      g.__epicReady = undefined;
      throw e;
    });
  }
  await g.__epicReady;
  return d;
}

export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const d = await driver();
  return d.query<T>(text, params);
}

export async function one<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

export async function tx<T>(fn: (q: Q) => Promise<T>): Promise<T> {
  const d = await driver();
  return d.transaction(fn);
}

export async function dbKind() {
  return (await driver()).kind;
}
