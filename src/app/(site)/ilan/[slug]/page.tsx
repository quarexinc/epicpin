import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Zap, Hand, ShieldCheck, Clock, Undo2, PackageCheck } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getFavoriteIds, getListingBySlug, getListings } from "@/lib/data";
import { discountPct, tl } from "@/lib/utils";
import { ListingCard, ListingCover } from "@/components/site/ListingCard";
import { BuyBox } from "@/components/site/BuyBox";
import { SectionHead } from "@/components/site/Section";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const l = await getListingBySlug((await params).slug);
  return { title: l?.title ?? "İlan", description: l?.description.slice(0, 150) };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await getListingBySlug(slug);
  if (!l || !l.active) notFound();
  const user = await getUser();
  const [favs, related] = await Promise.all([getFavoriteIds(user?.id), l.category_id ? getListings({ category: l.category_id, limit: 6 }) : Promise.resolve([])]);
  const pct = discountPct(l.price, l.old_price);
  const auto = l.delivery_type === "auto";

  return (
    <div className="container-ep">
      <nav className="flex items-center gap-1.5 py-5 text-sm text-mute" aria-label="Sayfa yolu">
        <Link href="/" className="hover:text-bone">Ana sayfa</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {l.category_slug && (
          <>
            <Link href={`/kategori/${l.category_slug}`} className="hover:text-bone">{l.category_name}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        )}
        <span className="truncate text-bone/80">{l.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="group relative aspect-[4/3] overflow-hidden rounded-[28px] border border-line lg:aspect-auto lg:min-h-[480px]">
          <ListingCover l={l} big />
          {pct > 0 && <span className="absolute left-5 top-5 rounded-xl bg-plasma px-3 py-1.5 font-display text-sm font-extrabold text-white">-%{pct} indirim</span>}
        </div>

        <div className="panel flex flex-col p-6 sm:p-8">
          {l.category_slug && (
            <Link href={`/kategori/${l.category_slug}`} className="w-fit text-sm font-semibold" style={{ color: l.category_color ?? undefined }}>
              {l.category_name}
            </Link>
          )}
          <h1 className="h-display mt-2 text-2xl leading-tight sm:text-3xl">{l.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip text-mint">{auto ? <Zap className="h-3.5 w-3.5" /> : <Hand className="h-3.5 w-3.5" />}{auto ? "Otomatik teslimat" : "Manuel teslimat"}</span>
            <span className={`chip ${l.stock > 0 ? "" : "text-plasma"}`}>
              <PackageCheck className="h-3.5 w-3.5" />
              {l.stock > 0 ? `${l.stock} adet stokta` : "Stokta yok"}
            </span>
            <span className="chip">{l.sold_count} kez satıldı</span>
          </div>

          <div className="mt-6 flex items-end gap-3">
            <span className="font-display text-4xl font-extrabold text-blaze">{tl(l.price)}</span>
            {pct > 0 && <span className="mb-1 text-lg text-mute line-through">{tl(l.old_price)}</span>}
          </div>
          {pct > 0 && <div className="mt-1 text-sm font-semibold text-mint">{tl(Number(l.old_price) - l.price)} daha az ödüyorsun</div>}

          <div className="perforation my-6 -mx-6 sm:-mx-8" />

          <BuyBox id={l.id} price={l.price} stock={l.stock} fav={favs.has(l.id)} />

          <ul className="mt-6 grid gap-2.5 text-sm text-mute">
            <li className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 text-ember" /> Orijinal ve kullanılmamış kod</li>
            <li className="flex items-center gap-2.5"><Clock className="h-4 w-4 text-ember" /> {auto ? "Kod ödeme anında Siparişlerim sayfasında" : "Ortalama 15 dakikada teslim"}</li>
            <li className="flex items-center gap-2.5"><Undo2 className="h-4 w-4 text-ember" /> Kullanılmamış kodlarda iade talebi</li>
          </ul>
        </div>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="panel p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold">Ürün açıklaması</h2>
          <div className="prose-ep mt-4 text-[15px]">
            {l.description.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="whitespace-pre-line">{p}</p>
            ))}
          </div>
        </div>
        <div className="panel p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold">Nasıl teslim edilir?</h2>
          <ol className="mt-4 grid gap-4">
            {(auto
              ? ["Ürünü sepete ekle ve bakiyenle öde.", "Kod saniyeler içinde Siparişlerim sayfasına düşer.", "Kodu kopyala, oyunun kod ekranında kullan."]
              : ["Ürünü sepete ekle ve bakiyenle öde.", "Sipariş sayfasından destek talebi açıp hesap bilgini ilet.", "Ekibimiz yüklemeyi yapar ve siparişini teslim edildi olarak işaretler."]
            ).map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ember/15 font-display text-xs font-bold text-ember">{i + 1}</span>
                <span className="pt-1 text-sm text-bone/85">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {related.filter((r) => r.id !== l.id).length > 0 && (
        <section className="mt-14">
          <SectionHead title={`Diğer ${l.category_name} ürünleri`} href={l.category_slug ? `/kategori/${l.category_slug}` : "/ilanlar"} />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {related.filter((r) => r.id !== l.id).slice(0, 5).map((r) => (
              <ListingCard key={r.id} l={r} fav={favs.has(r.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
