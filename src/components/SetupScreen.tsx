import { Database } from "lucide-react";
import { LogoMark } from "./Logo";

/** Vercel'de veritabanı bağlanmamışsa ziyaretçiye bozuk bir site yerine kurulum adımları gösterilir. */
export function SetupScreen() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-ash p-8">
        <LogoMark id="setup" className="h-14 w-14" />
        <h1 className="h-display mt-5 text-2xl">Kurulumu tamamlamak için veritabanı bağla</h1>
        <p className="mt-2 text-sm leading-6 text-mute">
          Site çalışıyor ama henüz bir veritabanına bağlı değil. Vercel&apos;de veritabanı olmadan üyelikler ve siparişler saklanamaz, bu yüzden site bu adımı bekliyor.
        </p>
        <ol className="mt-5 grid gap-3 text-sm">
          {[
            "Vercel'de projeni aç, Storage sekmesine gir.",
            "Create Database > Neon (Postgres) seç, bölge olarak Frankfurt (eu-central-1) seç ve projeye bağla.",
            "Settings > Environment Variables bölümüne AUTH_SECRET (uzun rastgele bir metin), ADMIN_EMAIL ve ADMIN_PASSWORD ekle.",
            "Deployments sekmesinden son yüklemeyi Redeploy et.",
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ember/15 font-display text-xs font-bold text-ember">{i + 1}</span>
              <span className="pt-1 text-bone/85">{t}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-center gap-2 rounded-xl border border-line bg-coal p-3 text-xs text-mute">
          <Database className="h-4 w-4 shrink-0 text-ember" /> Bağlantı kontrolü: /api/health
        </p>
      </div>
    </main>
  );
}
