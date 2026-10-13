import Link from "next/link";
import { SearchX } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getCategories, getFavoriteIds, getListings } from "@/lib/data";
import { ListingCard } from "./ListingCard";
import { Icon } from "../Icon";

const SORTS: [string, string][] = [
  ["", "En yeni"],
  ["populer", "Çok satan"],
  ["indirim", "En çok indirim"],
  ["artan", "Fiyat: düşükten"],
  ["azalan", "Fiyat: yüksekten"],
];
const SORT_MAP: Record<string, string> = { populer: "popular", indirim: "discount", artan: "price_asc", azalan: "price_desc" };

export async function ListingBrowser({ base, categoryId, q, sort, activeSlug }: { base: string; categoryId?: number; q?: string; sort?: string; activeSlug?: string }) {
  const user = await getUser();
  const [items, cats, favs] = await Promise.all([
    getListings({ category: categoryId, search: q, sort: SORT_MAP[sort ?? ""], discounted: sort === "indirim" }),
    getCategories(),
    getFavoriteIds(user?.id),
  ]);
  const href = (s: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (s) p.set("sirala", s);
    const str = p.toString();
    return `${base}${str ? `?${str}` : ""}`;
  };
  return (
    <div className="container-ep mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 panel p-2">
          <div className="px-3 pb-2 pt-2 text-xs font-semibold text-mute">Kategoriler</div>
          <Link href="/ilanlar" className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${!activeSlug ? "bg-ember/15 font-bold text-ember" : "hover:bg-smoke"}`}>
            <Icon name="Sparkles" className="h-4 w-4" /> Tümü
          </Link>
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/kategori/${c.slug}`}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${activeSlug === c.slug ? "bg-ember/15 font-bold text-ember" : "text-bone/85 hover:translate-x-1 hover:bg-smoke"}`}
            >
              <Icon name={c.icon} className="h-4 w-4 transition group-hover:scale-125" style={{ color: c.color }} />
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-mute">{c.listing_count}</span>
            </Link>
          ))}
        </div>
      </aside>
      <div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {q && (
            <span className="mr-2 text-sm text-mute">
              “<span className="font-semibold text-bone">{q}</span>” için {items.length} sonuç
            </span>
          )}
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {SORTS.map(([k, label]) => (
              <Link
                key={k}
                href={href(k)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition ${
                  (sort ?? "") === k ? "border-ember bg-ember text-void" : "border-line bg-ash text-bone/80 hover:border-ember/60"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        {items.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {items.map((l, i) => (
              <div key={l.id} data-reveal style={{ ["--d" as any]: `${(i % 4) * 60}ms` }}>
                <ListingCard l={l} fav={favs.has(l.id)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="panel grid place-items-center px-6 py-20 text-center">
            <SearchX className="h-12 w-12 text-mute" />
            <div className="mt-4 font-display text-lg font-bold">Burada ürün yok</div>
            <p className="mt-1 text-sm text-mute">Farklı bir arama dene ya da tüm ürünlere göz at.</p>
            <Link href="/ilanlar" className="btn-ember mt-5">Tüm ürünleri gör</Link>
          </div>
        )}
      </div>
    </div>
  );
}
