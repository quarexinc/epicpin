import Link from "next/link";
import { Zap } from "lucide-react";
import { maskName, timeAgo } from "@/lib/utils";
import { Icon } from "../Icon";
import { CountUp } from "../Motion";

type Sale = { username: string; title: string; slug: string | null; created_at: string; color: string | null; icon: string | null };

/** Gerçek son siparişlerden oluşan kayan "az önce alındı" şeridi. */
export function LiveFeed({ sales }: { sales: Sale[] }) {
  if (sales.length < 2) return null;
  const list = sales.length < 7 ? [...sales, ...sales, ...sales] : [...sales, ...sales];
  return (
    <div className="relative mt-8 flex items-center overflow-hidden rounded-2xl border border-line bg-ash/60">
      <div className="z-10 flex shrink-0 items-center gap-2 border-r border-line bg-ash px-4 py-3 text-sm font-bold">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint" />
        </span>
        Az önce alındı
      </div>
      <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]">
        <div className="flex w-max animate-marquee gap-3 py-2 pl-3 hover:[animation-play-state:paused]" style={{ animationDuration: `${list.length * 4}s` }}>
          {list.map((s, i) => (
            <Link
              key={i}
              href={s.slug ? `/ilan/${s.slug}` : "/ilanlar"}
              className="flex shrink-0 items-center gap-2.5 rounded-xl border border-line bg-coal px-3 py-1.5 text-[13px] transition hover:border-ember/60"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${s.color ?? "#FF6A13"}22`, color: s.color ?? "#FF6A13" }}>
                <Icon name={s.icon} className="h-4 w-4" />
              </span>
              <span className="font-semibold text-bone/90">{maskName(s.username)}</span>
              <span className="text-bone/70">{s.title}</span>
              <span className="text-xs text-mute">{timeAgo(s.created_at)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Kocaman, kayan kategori adları: her biri kategoriye gider. */
export function CategoryMarquee({ cats }: { cats: { name: string; slug: string; color: string }[] }) {
  if (!cats.length) return null;
  const row = [...cats, ...cats];
  return (
    <div className="relative -mx-4 mt-20 overflow-hidden border-y border-line bg-coal/60 py-6 sm:-mx-6 lg:mx-[calc(50%-50vw)]">
      <div className="flex w-max animate-marquee items-center gap-10 hover:[animation-play-state:paused]" style={{ animationDuration: `${cats.length * 6}s` }}>
        {row.map((c, i) => (
          <Link key={i} href={`/kategori/${c.slug}`} className="group flex items-center gap-10" style={{ ["--c" as any]: c.color }}>
            <span className="outline-text whitespace-nowrap font-display text-5xl font-extrabold tracking-[-0.03em] transition-all duration-300 group-hover:text-[var(--c)] group-hover:[-webkit-text-stroke-color:var(--c)] sm:text-7xl">
              {c.name}
            </span>
            <Zap className="h-8 w-8 shrink-0 text-ember/60 transition group-hover:rotate-12 group-hover:text-ember" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function StatsStrip({ stats }: { stats: { products: number; categories: number; sold: number; delivered: number } }) {
  const items: [number, string, string, string?][] = [
    [stats.products, "Ürün", "/ilanlar"],
    [stats.categories, "Oyun ve platform", "/kategoriler"],
    [stats.sold, "Satış", "/ilanlar?sirala=populer", "+"],
  ];
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
      {items.map(([n, label, href, suf]) => (
        <Link key={label} href={href} data-reveal className="group rounded-2xl border border-line bg-ash/50 px-4 py-4 transition hover:border-ember/50 hover:bg-ash sm:px-6">
          <div className="font-display text-2xl font-extrabold text-bone transition group-hover:text-blaze sm:text-4xl">
            <CountUp to={n} suffix={suf} />
          </div>
          <div className="mt-1 text-xs text-mute sm:text-sm">{label}</div>
        </Link>
      ))}
    </div>
  );
}
