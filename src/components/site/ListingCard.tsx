import Link from "next/link";
import { Zap, Hand } from "lucide-react";
import type { Listing } from "@/lib/data";
import { discountPct, img, tl } from "@/lib/utils";
import { Icon } from "../Icon";
import { AddToCartButton, FavoriteButton } from "./ListingActions";
import { Tilt } from "../Motion";

export function ListingCover({ l, big = false, mini = false }: { l: Pick<Listing, "title" | "cover_image_id" | "category_color" | "category_icon" | "category_name">; big?: boolean; mini?: boolean }) {
  const cover = img(l.cover_image_id);
  const color = l.category_color || "#FF6A13";
  if (cover)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={cover} alt={l.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" decoding="async" />;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: `radial-gradient(90% 120% at 100% 0%, ${color}66, transparent 60%), linear-gradient(160deg, ${color}26, #121016 70%)` }}>
      <div className="grid-bg absolute inset-0 opacity-70" />
      {!mini && <Icon
        name={l.category_icon}
        className={`absolute -right-4 -bottom-6 rotate-[-14deg] opacity-25 transition duration-500 group-hover:rotate-0 group-hover:scale-110 ${big ? "h-72 w-72" : "h-36 w-36"}`}
        style={{ color }}
      />}
      {mini ? (
        <Icon name={l.category_icon} className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color }} />
      ) : (
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 pr-10 ${big ? "left-8" : ""}`}>
        <div className="mb-1 text-[11px] font-bold opacity-80" style={{ color }}>{l.category_name}</div>
        <div className={`h-display leading-[1.05] text-bone drop-shadow-lg ${big ? "text-4xl" : "text-[1.15rem]"}`}>{l.title.replace(l.category_name ?? "", "").trim() || l.title}</div>
      </div>
      )}
    </div>
  );
}

export function ListingCard({ l, fav = false }: { l: Listing; fav?: boolean }) {
  const pct = discountPct(l.price, l.old_price);
  const out = l.stock <= 0;
  return (
    <Tilt className="group rounded-2xl">
      <div className="ticket relative overflow-hidden rounded-2xl border border-line bg-ash transition duration-300 group-hover:-translate-y-1 group-hover:border-ember/60" style={{ ["--notch-y" as any]: "160px" }}>
        <Link href={`/ilan/${l.slug}`} className="block" aria-label={l.title}>
          <div className="relative h-40">
            <ListingCover l={l} />
            {pct > 0 && (
              <span className="absolute left-3 top-3 rounded-lg bg-plasma px-2 py-1 font-display text-xs font-extrabold text-white shadow-lg">
                -%{pct}
              </span>
            )}
            {l.featured && !out && (
              <span className="absolute bottom-3 left-3 rotate-[-4deg] rounded-md bg-blaze px-2 py-0.5 font-display text-[10px] font-extrabold text-void shadow-lg transition group-hover:rotate-0 group-hover:scale-110">
                Popüler
              </span>
            )}
            {out && <span className="absolute inset-0 grid place-items-center bg-black/60 font-display text-sm font-bold">Stokta yok</span>}
          </div>
          <div className="perforation mx-4" />
          <div className="p-4 pt-3.5">
            <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-mute">
              <span className="truncate">{l.category_name}</span>
              <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md bg-mint/10 px-1.5 py-0.5 text-mint">
                {l.delivery_type === "auto" ? <Zap className="h-3 w-3" /> : <Hand className="h-3 w-3" />}
                {l.delivery_type === "auto" ? "Anında" : "Manuel"}
              </span>
            </div>
            <h3 className="line-clamp-2 min-h-[2.5rem] text-[15px] font-bold leading-5">{l.title}</h3>
            <div className="mt-3 flex items-end justify-between gap-2">
              <div className="leading-none">
                <div className={`mb-1 text-xs text-mute line-through ${pct > 0 ? "" : "invisible"}`}>{pct > 0 ? tl(l.old_price) : "0"}</div>
                <div className="font-display text-lg font-extrabold text-blaze">{tl(l.price)}</div>
              </div>
              <span className="text-[11px] text-mute">{l.sold_count} satıldı</span>
            </div>
          </div>
        </Link>
        <div className="px-4 pb-4">
          <AddToCartButton id={l.id} disabled={out} />
        </div>
      </div>
      <FavoriteButton id={l.id} initial={fav} className="absolute right-3 top-3 z-20 group-hover:-translate-y-1" />
    </Tilt>
  );
}
