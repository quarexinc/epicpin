import Link from "next/link";
import { Suspense } from "react";
import { Bell, Heart, Wallet, Headphones, Newspaper, Megaphone, ChevronRight } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getAnnouncements, getCategories, getSettings } from "@/lib/data";
import { img, tl } from "@/lib/utils";
import { Logo } from "../Logo";
import { Icon } from "../Icon";
import { CartButton, CategoryMenu, MobileMenu, NavLink, SearchBox, UserMenu } from "./HeaderClient";

export async function Header() {
  const [user, settings, cats, anns] = await Promise.all([getUser(), getSettings(), getCategories(), getAnnouncements()]);
  const ticker = anns.filter((a) => a.in_ticker);
  const promos = [1, 2, 3]
    .map((i) => ({ title: settings[`promo${i}_title`], text: settings[`promo${i}_text`], link: settings[`promo${i}_link`] || "/" }))
    .filter((p) => p.title);
  const promoCats = promos.map((p) => cats.find((c) => p.link.endsWith(`/${c.slug}`)));
  const logoUrl = img(settings.logo_image_id);

  return (
    <>
      {/* Kampanya şeridi */}
      {promos.length > 0 && (
        <div className="hidden md:grid grid-cols-3 border-b border-line bg-coal">
          {promos.map((p, i) => {
            const c = promoCats[i];
            return (
              <Link
                key={i}
                href={p.link}
                className="group relative flex items-center gap-3 overflow-hidden px-6 py-3 transition hover:bg-ash"
              >
                <span
                  className="absolute inset-y-0 left-0 w-1/2 opacity-25 transition group-hover:opacity-40"
                  style={{ background: `linear-gradient(90deg, ${c?.color ?? "#FF6A13"}55, transparent)` }}
                />
                <span
                  className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{ background: `${c?.color ?? "#FF6A13"}22`, color: c?.color ?? "#FF6A13" }}
                >
                  <Icon name={c?.icon} className="h-5 w-5" />
                </span>
                <span className="relative leading-tight">
                  <span className="block font-display text-[13px] font-bold">{p.title}</span>
                  <span className="block text-xs text-mute group-hover:text-bone/80">{p.text}</span>
                </span>
                <ChevronRight className="relative ml-auto h-4 w-4 -translate-x-2 text-mute opacity-0 transition group-hover:translate-x-0 group-hover:text-ember group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Üst bar: duyuru akışı + bağlantılar */}
      <div className="border-b border-line bg-void/90">
        <div className="container-ep flex h-10 items-center gap-6 text-[13px]">
          <Link href="/duyurular" className="flex shrink-0 items-center gap-1.5 font-semibold text-ember">
            <Megaphone className="h-4 w-4" /> Duyurular
          </Link>
          <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
            <div className="flex w-max animate-marquee gap-10 whitespace-nowrap text-mute hover:[animation-play-state:paused]">
              {[...ticker, ...ticker, ...ticker, ...ticker].map((a, i) => (
                <Link key={i} href={a.link || "/duyurular"} className="hover:text-bone">
                  <span className="mr-2 text-ember">✦</span>
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
          <nav className="hidden lg:flex shrink-0 items-center gap-5 text-mute">
            <Link href="/blog" className="flex items-center gap-1.5 hover:text-bone">
              <Newspaper className="h-4 w-4" /> Blog
            </Link>
            <Link href="/destek" className="flex items-center gap-1.5 hover:text-bone">
              <Headphones className="h-4 w-4" /> Destek merkezi
            </Link>
            <span className="rounded-md border border-line px-2 py-0.5 text-xs font-bold text-bone">TRY ₺</span>
          </nav>
        </div>
      </div>

      {/* Ana başlık */}
      <header className="sticky top-0 z-40 border-b border-line bg-coal/85 backdrop-blur-xl transition-[background-color,box-shadow] duration-300 [html[data-scrolled]_&]:bg-coal/95 [html[data-scrolled]_&]:shadow-[0_12px_40px_-12px_rgba(0,0,0,.9)]">
        <div className="container-ep flex h-[72px] items-center gap-2 transition-[height] duration-300 md:gap-6 [html[data-scrolled]_&]:h-[62px]">
          <MobileMenu cats={cats.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon, color: c.color }))} isAdmin={user?.role === "admin"} loggedIn={!!user} />
          <Link href="/" aria-label="EpicPin ana sayfa" className="shrink-0">
            <Logo logoUrl={logoUrl} />
          </Link>
          <div className="hidden flex-1 md:block">
            <Suspense fallback={<div className="h-11" />}>
              <SearchBox />
            </Suspense>
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {user && (
              <Link
                href="/bakiye-yukle"
                className="hidden sm:flex items-center gap-2 rounded-xl border border-ember/30 bg-ember/10 px-3 py-2 text-sm font-bold text-blaze transition hover:-translate-y-0.5 hover:border-ember hover:bg-ember/20"
                title="Bakiye yükle"
              >
                <Wallet className="h-4 w-4" />
                {tl(user.balance)}
              </Link>
            )}
            <Link href="/hesabim/favoriler" className="hidden sm:grid h-10 w-10 place-items-center rounded-xl text-mute transition hover:bg-smoke hover:text-bone" aria-label="Favorilerim">
              <Heart className="h-5 w-5" />
            </Link>
            <Link href="/duyurular" className="relative hidden sm:grid h-10 w-10 place-items-center rounded-xl text-mute transition hover:bg-smoke hover:text-bone" aria-label="Duyurular">
              <Bell className="h-5 w-5" />
              {anns.length > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ember px-1 text-[10px] font-bold text-void">
                  {anns.length}
                </span>
              )}
            </Link>
            <CartButton />
            <UserMenu user={user ? { username: user.username, role: user.role, balance: user.balance } : null} />
          </div>
        </div>
        <div className="container-ep pb-3 md:hidden">
          <Suspense fallback={<div className="h-11" />}>
              <SearchBox />
            </Suspense>
        </div>
      </header>

      {/* Menü */}
      <div className="relative z-30 hidden md:block border-b border-line bg-void/60">
        <div className="container-ep flex h-14 items-center gap-1">
          <CategoryMenu cats={cats.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon, color: c.color, count: c.listing_count ?? 0 }))} />
          <Suspense>
            <NavLink href="/ilanlar">İlan pazarı</NavLink>
            <NavLink href="/ilanlar?sirala=indirim">Haftanın fırsatları</NavLink>
            <NavLink href="/ilanlar?sirala=populer">Çok satanlar</NavLink>
            <NavLink href="/blog">Blog</NavLink>
            <NavLink href="/destek">Destek</NavLink>
          </Suspense>
          <Link href="/bakiye-yukle" className="btn-ember ml-auto">
            <Wallet className="h-4 w-4" /> Bakiye yükle
          </Link>
        </div>
      </div>
    </>
  );
}

