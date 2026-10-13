import Link from "next/link";
import { Flame, Store, ArrowRight, Wallet, MousePointerClick, KeyRound } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getBanners, getCategories, getFavoriteIds, getListings, getPosts, getRecentSales, getSettings, getStats } from "@/lib/data";
import { img } from "@/lib/utils";
import { HeroSlider } from "@/components/site/HeroSlider";
import { ListingCard } from "@/components/site/ListingCard";
import { SectionHead } from "@/components/site/Section";
import { Countdown } from "@/components/site/Countdown";
import { Icon } from "@/components/Icon";
import { PostCard } from "@/components/site/PostCard";
import { CategoryMarquee, LiveFeed, StatsStrip } from "@/components/site/HomeBits";
import { Tilt } from "@/components/Motion";

export default async function Home() {
  const user = await getUser();
  const [banners, cats, deals, popular, featured, fresh, posts, favs, sales, stats, settings] = await Promise.all([
    getBanners(),
    getCategories(),
    getListings({ discounted: true, sort: "discount", limit: 10 }),
    getListings({ sort: "popular", limit: 10 }),
    getListings({ featured: true, sort: "popular", limit: 4 }),
    getListings({ limit: 5 }),
    getPosts(3),
    getFavoriteIds(user?.id),
    getRecentSales(),
    getStats(),
    getSettings(),
  ]);
  const barCats = cats.filter((c) => c.show_in_bar);

  return (
    <div className="container-ep">
      {/* Hızlı kategori çipleri */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-5 sm:mx-0 sm:px-0">
        <Link href="/ilanlar" className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-br from-blaze to-ember px-4 py-2.5 text-sm font-bold text-void transition hover:-translate-y-0.5 hover:brightness-110">
          <Store className="h-4 w-4" /> İlan pazarı
        </Link>
        <Link href="/ilanlar?sirala=indirim" className="group flex shrink-0 items-center gap-2 rounded-full border border-line bg-ash px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-plasma hover:text-plasma">
          <Flame className="h-4 w-4 text-plasma transition group-hover:scale-125" /> Fırsatlar
        </Link>
        {barCats.map((c) => (
          <Link
            key={c.id}
            href={`/kategori/${c.slug}`}
            className="group flex shrink-0 items-center gap-2 rounded-full border border-line bg-ash px-4 py-2.5 text-sm font-semibold text-bone/85 transition hover:-translate-y-0.5 hover:border-[var(--c)] hover:text-bone hover:shadow-[0_8px_24px_-10px_var(--c)]"
            style={{ ["--c" as any]: c.color }}
          >
            <Icon name={c.icon} className="h-4 w-4 transition group-hover:scale-125 group-hover:-rotate-12" style={{ color: c.color }} />
            {c.name}
          </Link>
        ))}
      </div>

      <HeroSlider banners={banners.map((b) => ({ ...b, image: img(b.image_id) }))} />

      {settings.live_feed_on !== "" && <LiveFeed sales={sales} />}

      {/* Kategori şeridi */}
      <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto rounded-3xl border border-line bg-ash/60 p-3">
        {cats.map((c) => (
          <Link key={c.id} href={`/kategori/${c.slug}`} className="group flex shrink-0 grow items-center gap-3 rounded-2xl p-2.5 pr-5 transition hover:bg-smoke">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl transition duration-300 group-hover:-rotate-6 group-hover:scale-110"
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

      <StatsStrip stats={stats} />

      {/* Fırsatlar */}
      {deals.length > 0 && (
        <section className="mt-16">
          <SectionHead title="Haftanın fırsatları" sub="Pazar gece yarısına kadar indirimli." href="/ilanlar?sirala=indirim" extra={<Link href="/ilanlar?sirala=indirim"><Countdown /></Link>} />
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 pt-2 sm:mx-0 sm:px-0">
            {deals.map((l, i) => (
              <div key={l.id} data-reveal style={{ ["--d" as any]: `${i * 60}ms` }} className="w-[250px] shrink-0 snap-start">
                <ListingCard l={l} fav={favs.has(l.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popüler kategoriler: bento */}
      <section className="mt-14">
        <SectionHead title="Ne oynuyorsun?" sub="Oyununu seç, kodunu saniyeler içinde al." href="/kategoriler" />
        <div className="grid auto-rows-[150px] grid-cols-2 gap-3 md:grid-cols-4 lg:auto-rows-[170px]">
          {cats.slice(0, 8).map((c, i) => (
            <div key={c.id} data-reveal style={{ ["--d" as any]: `${i * 50}ms` }} className={i === 0 ? "col-span-2 row-span-2" : i === 1 ? "md:row-span-2" : ""}>
              <Tilt className="h-full rounded-3xl" max={6}>
                <Link
                  href={`/kategori/${c.slug}`}
                  className="group relative block h-full overflow-hidden rounded-3xl border border-line p-5 transition hover:border-white/25"
                  style={{ background: `radial-gradient(100% 100% at 100% 100%, ${c.color}55, transparent 65%), #121016` }}
                >
                  {c.image_id ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img(c.image_id)!} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-700 group-hover:scale-110" />
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
                      <div className={`h-display leading-none transition group-hover:translate-x-1 ${i === 0 ? "text-4xl sm:text-5xl" : "text-xl"}`}>{c.name}</div>
                      {i < 2 && <p className="mt-2 max-w-xs text-sm text-bone/70">{c.description}</p>}
                      {i === 0 && (
                        <span className="btn-ember mt-4 w-fit px-4 py-2 text-xs">
                          Ürünleri gör <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </Tilt>
            </div>
          ))}
        </div>
      </section>

      {/* Öne çıkanlar */}
      {featured.length > 0 && (
        <section className="mt-16">
          <SectionHead title="Öne çıkanlar" sub="Ekibimizin bu hafta seçtikleri." href="/ilanlar?sirala=populer" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((l, i) => (
              <div key={l.id} data-reveal style={{ ["--d" as any]: `${i * 70}ms` }}>
                <ListingCard l={l} fav={favs.has(l.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      <CategoryMarquee cats={cats.map((c) => ({ name: c.name, slug: c.slug, color: c.color }))} />

      {/* Çok satanlar */}
      <section className="mt-16">
        <SectionHead title="Çok satanlar" sub="Oyuncuların en çok aldıkları." href="/ilanlar?sirala=populer" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {popular.map((l, i) => (
            <div key={l.id} data-reveal style={{ ["--d" as any]: `${(i % 5) * 60}ms` }}>
              <ListingCard l={l} fav={favs.has(l.id)} />
            </div>
          ))}
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section data-reveal className="mt-16 overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-ash to-coal">
        <div className="grid md:grid-cols-[1fr_2fr]">
          <div className="border-b border-line p-8 md:border-b-0 md:border-r">
            <h2 className="h-display text-3xl leading-tight">Kodun 10 saniyede elinde.</h2>
            <p className="mt-3 text-sm leading-6 text-mute">Bakiyeni bir kez yükle, sonra tek tıkla al. Otomatik teslimatlı ürünlerde kod ödeme anında Siparişlerim sayfasında.</p>
            <Link href={user ? "/bakiye-yukle" : "/kayit"} className="btn-ember mt-6">
              {user ? "Bakiye yükle" : "Ücretsiz kayıt ol"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ol className="grid sm:grid-cols-3">
            {(
              [
                ["Bakiye yükle", "Havale, Papara veya kripto ile hesabına bakiye ekle.", "/bakiye-yukle", Wallet],
                ["Ürünü seç", "Oyununu bul, paketi sepete ekle, bakiyenle öde.", "/ilanlar", MousePointerClick],
                ["Kodu kullan", "Kod anında ekranında. Kopyala, oyunda kullan.", "/hesabim/siparisler", KeyRound],
              ] as const
            ).map(([t, d, href, I], i) => (
              <li key={t} className="border-line sm:border-l first:sm:border-l-0">
                <Link href={href} className="group block h-full p-8 transition hover:bg-smoke/40">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-6xl font-extrabold text-transparent transition group-hover:text-ember/20 [-webkit-text-stroke:1.5px_#FF6A13]">{i + 1}</span>
                    <I className="h-6 w-6 text-mute transition group-hover:-rotate-12 group-hover:scale-125 group-hover:text-ember" />
                  </div>
                  <div className="mt-4 font-display text-lg font-bold">{t}</div>
                  <p className="mt-1.5 text-sm text-mute">{d}</p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Yeni eklenenler */}
      <section className="mt-16">
        <SectionHead title="Yeni eklenenler" href="/ilanlar" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {fresh.map((l, i) => (
            <div key={l.id} data-reveal style={{ ["--d" as any]: `${i * 60}ms` }}>
              <ListingCard l={l} fav={favs.has(l.id)} />
            </div>
          ))}
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="mt-16">
          <SectionHead title="Blogdan" sub="Rehberler, kampanyalar ve oyun dünyasından haberler." href="/blog" />
          <div className="grid gap-4 md:grid-cols-3">
            {posts.map((p, i) => (
              <div key={p.id} data-reveal style={{ ["--d" as any]: `${i * 80}ms` }}>
                <PostCard p={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
