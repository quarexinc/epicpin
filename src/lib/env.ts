/**
 * Ortam değişkenleri. Vercel'de Neon/Supabase bağlanınca adres farklı adlarla gelebilir
 * (DATABASE_URL, POSTGRES_URL ya da özel önekli STORAGE_DATABASE_URL gibi); hepsi taranır.
 */
const PREFERRED = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "NEON_DATABASE_URL", "SUPABASE_DB_URL"];

export function databaseUrl(): string | null {
  const isPg = (v?: string) => !!v && /^postgres(ql)?:\/\//i.test(v.trim());
  for (const k of PREFERRED) if (isPg(process.env[k])) return process.env[k]!.trim();
  const keys = Object.keys(process.env).filter((k) => /(DATABASE_URL|POSTGRES_URL)$/i.test(k) && isPg(process.env[k]));
  // Havuzlu (pooled) bağlantı tercih edilir; "UNPOOLED"/"NON_POOLING" sona bırakılır
  keys.sort((a, b) => Number(/UNPOOLED|NON_POOLING/i.test(a)) - Number(/UNPOOLED|NON_POOLING/i.test(b)));
  return keys.length ? process.env[keys[0]]!.trim() : null;
}

/** Vercel gibi sunucusuz ortamda mı çalışıyoruz? Orada gömülü veritabanı kullanılamaz. */
export function isServerless() {
  return !!(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export function dbConfigured() {
  return !!databaseUrl() || !isServerless();
}

export function isProduction() {
  return process.env.NODE_ENV === "production" && (isServerless() || !!databaseUrl());
}
