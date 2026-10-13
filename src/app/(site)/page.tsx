import Link from "next/link";
import { Flame, Store, ArrowRight } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getBanners, getCategories, getFavoriteIds, getListings, getPosts } from "@/lib/data";
import { img } from "@/lib/utils";
import { HeroSlider } from "@/components/site/HeroSlider";
import { ListingCard } from "@/components/site/ListingCard";
import { SectionHead } from "@/components/site/Section";
import { Countdown } from "@/components/site/Countdown";
import { Icon } from "@/components/Icon";
import { PostCard } from "@/components/site/PostCard";

export default async function Home() {
  const user = await getUser();
  const [banners, cats, deals, popular, fresh, posts, favs] = await Promise.all([
    getBanners(),
    getCategories(),
    getListings({ discounted: true, sort: "discount", limit: 10 }),
    getListings({ sort: "popular", limit: 10 }),
    getListings({ limit: 5 }),
    getPosts(3),
    getFavoriteIds(user?.id),
  ]);
  const barCats = cats.filter((c) => c.show_in_bar);

  return (
    <div className="container-ep">
      {/* Hızlı kategori çipleri */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-5 sm:mx-0 sm:px-0">
        <Link href="/ilanlar" className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-br from-blaze to-ember px-4 py-2.5 text-sm font-bold text-void">
          <Store className="h-4 w-4" /> İlan pazarı
        </Link>
        <Link href="/ilanlar?sirala=indirim" className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-ash px-4 py-2.5 text-sm font-semibold transition hover:border-plasma hover:text-plasma">
          <Flame className="h-4 w-4 text-plasma" /> Fırsatlar
        </Link>
        {barCats.map((c) => (
          <Link
            key={c.id}
            href={`/kategori/${c.slug}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-ash px-4 py-2.5 text-sm font-semibold text-bone/85 transition hover:text-bone"
            style={{ ["--c" as any]: c.color }}
          >
            <Icon name={c.icon} className="h-4 w-4" style={{ color: c.color }} />
            {c.name}
          </Link>
        ))}
      </div>

      <HeroSlider banners={banners.map((b) => ({ ...b, image: img(b.image_id) }))} />

      {/* Kategori şeridi */}
      <div className="no-scrollbar mt-8 flex gap-3 overflow-x-auto rounded-3xl border border-line bg-ash/60 p-3">
        {cats.map((c) => (
          <Link key={c.id} href={`/kategori/${c.slug}`} className="group flex shrink-0 grow items-center gap-3 rounded-2xl p-2.5 pr-5 transition hover:bg-smoke">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl transition group-hover:-rotate-6 group-hover:scale-110"
              style={{ background: `linear-gradient(135deg, ${c.color}40, ${c.color}10)`, color: c.color, boxShadow: `inset 0 0 0 1px ${c.color}40` }}
            >
              <Icon name={c.icon} className="h-6 w-6" />
            </span>
            <span className="leading-tight">
              <span className="block whitespace-nowrap text-sm font-bold">{c.name}</span>
              <span className="text-xs text-mute">{c.listing_count} ürün</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Fırsatlar */}
      {deals.length > 0 && (
        <section className="mt-16">
          <SectionHead title="Haftanın fırsatları" sub="Pazar gece yarısına kadar indirimli." href="/ilanlar?sirala=indirim" extra={<Countdown />} />
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {deals.map((l) => (
              <div key={l.id} className="w-[250px] shrink-0 snap-start">
                <ListingCard l={l} fav={favs.has(l.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popüler kategoriler: bento */}
      <section className="mt-16">
        <SectionHead title="Ne oynuyorsun?" sub="Oyununu seç, kodunu saniyeler içinde al." href="/kategoriler" />
        <div className="grid auto-rows-[150px] grid-cols-2 gap-3 md:grid-cols-4 lg:auto-rows-[170px]">
          {cats.slice(0, 8).map((c, i) => (
            <Link
              key={c.id}
              href={`/kategori/${c.slug}`}
              className={`group relative overflow-hidden rounded-3xl border border-line p-5 transition hover:border-white/20 ${i === 0 ? "col-span-2 row-span-2" : i === 1 ? "md:row-span-2" : ""}`}
              style={{ background: `radial-gradient(100% 100% at 100% 100%, ${c.color}55, transparent 65%), #121016` }}
            >
              {c.image_id ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img(c.image_id)!} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-105" />
              ) : (
                <Icon
                  name={c.icon}
                  className={`absolute -bottom-6 -right-6 rotate-[-12deg] transition duration-500 group-hover:rotate-0 group-hover:scale-110 ${i === 0 ? "h-64 w-64" : "h-32 w-32"}`}
                  style={{ color: c.color, opacity: 0.35 }}
                />
              )}
              <div className="relative flex h-full flex-col justify-between">
                <span className="w-fit rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">{c.listing_count} ürün</span>
                <div>
                  <div className={`h-display leading-none ${i === 0 ? "text-4xl sm:text-5xl" : "text-xl"}`}>{c.name}</div>
                  {i < 2 && <p className="mt-2 max-w-xs text-sm text-bone/70">{c.description}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Çok satanlar */}
      <section className="mt-16">
        <SectionHead title="Çok satanlar" sub="Oyuncuların bu hafta en çok aldıkları." href="/ilanlar?sirala=populer" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {popular.map((l) => (
            <ListingCard key={l.id} l={l} fav={favs.has(l.id)} />
          ))}
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="mt-16 overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-ash to-coal">
        <div className="grid md:grid-cols-[1fr_2fr]">
          <div className="border-b border-line p-8 md:border-b-0 md:border-r">
            <h2 className="h-display text-3xl leading-tight">Kodun 10 saniyede elinde.</h2>
            <p className="mt-3 text-sm leading-6 text-mute">Bakiyeni bir kez yükle, sonra tek tıkla al. Otomatik teslimatlı ürünlerde kod ödeme anında Siparişlerim sayfasında.</p>
            <Link href={user ? "/bakiye-yukle" : "/kayit"} className="btn-ember mt-6">
              {user ? "Bakiye yükle" : "Ücretsiz kayıt ol"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ol className="grid sm:grid-cols-3">
            {[
              ["Bakiye yükle", "Havale, Papara veya kripto ile hesabına bakiye ekle."],
              ["Ürünü seç", "Oyununu bul, paketi sepete ekle, bakiyenle öde."],
              ["Kodu kullan", "Kod anında ekranında. Kopyala, oyunda kullan."],
            ].map(([t, d], i) => (
              <li key={t} className="relative border-line p-8 sm:border-l first:sm:border-l-0">
                <span className="font-display text-6xl font-extrabold text-transparent [-webkit-text-stroke:1.5px_#FF6A13]">{i + 1}</span>
                <div className="mt-4 font-display text-lg font-bold">{t}</div>
                <p className="mt-1.5 text-sm text-mute">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Yeni eklenenler */}
      <section className="mt-16">
        <SectionHead title="Yeni eklenenler" href="/ilanlar" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {fresh.map((l) => (
            <ListingCard key={l.id} l={l} fav={favs.has(l.id)} />
          ))}
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="mt-16">
          <SectionHead title="Blogdan" sub="Rehberler, kampanyalar ve oyun dünyasından haberler." href="/blog" />
          <div className="grid gap-4 md:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
