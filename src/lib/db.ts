import "server-only";
import { MIGRATIONS_SQL, SCHEMA_SQL } from "./schema";
import { seedDatabase, seedExtras } from "./seed";

const SCHEMA_VERSION = "3";

type Row = Record<string, any>;
export type Q = <T = Row>(text: string, params?: unknown[]) => Promise<T[]>;

interface Driver {
  query: Q;
  transaction: <T>(fn: (q: Q) => Promise<T>) => Promise<T>;
  exec: (sql: string) => Promise<void>;
  kind: "postgres" | "pglite";
}

const g = globalThis as unknown as { __epicDriver?: Promise<Driver>; __epicReady?: Promise<void> };

async function createDriver(): Promise<Driver> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const postgres = (await import("postgres")).default;
    const sql = postgres(url, {
      max: 5,
      idle_timeout: 20,
      prepare: false,
      connection: { TimeZone: "Europe/Istanbul" },
      ssl: url.includes("localhost") || url.includes("sslmode=disable") ? false : "require",
      types: { numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) } } as any,
    });
    const query: Q = async (text, params = []) => (await sql.unsafe(text, params as any[])) as any;
    return {
      kind: "postgres",
      query,
      exec: async (s) => {
        await sql.unsafe(s);
      },
      transaction: async (fn) =>
        (await sql.begin(async (tx) => fn(async (text, params = []) => (await tx.unsafe(text, params as any[])) as any))) as any,
    };
  }
  // Yerel geliştirme / veritabanı bağlanmamışsa gömülü Postgres (PGlite)
  const { PGlite } = await import("@electric-sql/pglite");
  let dir: string | undefined;
  if (!process.env.VERCEL) {
    const { mkdirSync } = await import("fs");
    mkdirSync("./.data", { recursive: true });
    dir = "./.data/pglite";
  }
  if (process.env.VERCEL) console.warn("[EpicPin] DATABASE_URL tanımlı değil: veriler geçici bellekte tutuluyor.");
  const db = new PGlite(dir);
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
        db.transaction(async (tx) =>
          fn(async (text, params = []) => {
            const r = await tx.query<Row>(text, params as any[]);
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
  if (!g.__epicDriver) g.__epicDriver = createDriver();
  const d = await g.__epicDriver;
  if (!g.__epicReady) {
    g.__epicReady = (async () => {
      if (d.kind === "pglite") await d.exec("SET TIME ZONE 'Europe/Istanbul'");
      // Şema güncelse soğuk açılışta tek sorguyla geç
      try {
        const v = await d.query<{ value: string }>("SELECT value FROM settings WHERE key = 'schema_version'");
        if (v[0]?.value === SCHEMA_VERSION) return;
      } catch {}
      await d.transaction(async (q) => {
        // Aynı anda açılan sunucular şemayı birlikte kurmaya çalışmasın
        await q("SELECT pg_advisory_xact_lock(7340211)");
        for (const stmt of (SCHEMA_SQL + MIGRATIONS_SQL).split(";").map((x) => x.trim()).filter(Boolean)) await q(stmt);
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
