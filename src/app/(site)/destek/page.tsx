import Link from "next/link";
import { Headphones, MessageCircle } from "lucide-react";
import { getUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { dateTimeTR } from "@/lib/utils";
import { PageHead } from "@/components/site/Section";
import { StatusBadge } from "@/components/StatusBadge";
import { NewTicketForm } from "@/components/site/TicketForms";

export const metadata = { title: "Destek merkezi" };

const FAQ = [
  ["Kodum ne zaman gelir?", "Otomatik teslimatlı ürünlerde kod ödeme anında Siparişlerim sayfasında görünür. Manuel ürünler ortalama 15 dakikada teslim edilir."],
  ["Bakiye yükleme ne kadar sürer?", "Havale/EFT ve Papara bildirimleri genellikle 5-15 dakika içinde onaylanır."],
  ["Kod çalışmıyor, ne yapmalıyım?", "Hesap bölgeni kontrol et. Sorun devam ederse sipariş numaranla destek talebi aç veya sipariş sayfasından iade talebi oluştur."],
  ["İade alabilir miyim?", "Kullanılmamış kodlar için iade talebi açabilirsin. Onaylanan iadeler bakiyene eklenir."],
];

export default async function Page({ searchParams }: { searchParams: Promise<{ siparis?: string }> }) {
  const u = await getUser();
  const { siparis } = await searchParams;
  const [tickets, orders] = u
    ? await Promise.all([
        q<{ id: number; subject: string; status: string; updated_at: string }>("SELECT * FROM tickets WHERE user_id = $1 ORDER BY updated_at DESC", [u.id]),
        q<{ id: number; label: string }>(
          "SELECT o.id, string_agg(oi.title, ', ') AS label FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.id DESC LIMIT 30",
          [u.id],
        ),
      ])
    : [[], []];
  return (
    <>
      <PageHead title="Destek merkezi" sub="Ekibimiz 7/24 burada. Sorununu yaz, en kısa sürede dönelim." />
      <div className="container-ep mt-8 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <div className="panel p-6 sm:p-8">
            <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-bold"><MessageCircle className="h-5 w-5 text-ember" /> Yeni destek talebi</h2>
            {u ? (
              <NewTicketForm orders={orders} defaultOrder={siparis ? Number(siparis) : undefined} />
            ) : (
              <div className="text-sm text-mute">
                Destek talebi açmak için <Link href="/giris?next=/destek" className="font-semibold text-ember">giriş yap</Link> ya da <Link href="/kayit" className="font-semibold text-ember">kayıt ol</Link>.
              </div>
            )}
          </div>
          {u && (
            <div className="panel">
              <div className="border-b border-line p-5 font-display font-bold">Taleplerim</div>
              {tickets.length ? (
                <ul className="divide-y divide-line">
                  {tickets.map((t) => (
                    <li key={t.id}>
                      <Link href={`/destek/${t.id}`} className="flex items-center gap-3 p-5 hover:bg-smoke/40">
                        <span className="font-display text-sm font-bold text-mute">#{t.id}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold">{t.subject}</span>
                        <span className="hidden text-xs text-mute sm:inline">{dateTimeTR(t.updated_at)}</span>
                        <StatusBadge status={t.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-6 text-sm text-mute">Açtığın talepler burada listelenir.</p>
              )}
            </div>
          )}
        </div>
        <div className="panel p-6">
          <h2 className="flex items-center gap-2 font-display font-bold"><Headphones className="h-5 w-5 text-ember" /> Sık sorulanlar</h2>
          <div className="mt-4 grid gap-2">
            {FAQ.map(([qq, a]) => (
              <details key={qq} className="group rounded-xl border border-line bg-coal p-4 open:border-ember/40">
                <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">{qq}</summary>
                <p className="mt-2 text-sm text-mute">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
