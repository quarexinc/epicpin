import Link from "next/link";
import { Plus, Search, Pencil, Star, Eye, EyeOff, Zap, Hand } from "lucide-react";
import { getListings } from "@/lib/data";
import { discountPct, tl } from "@/lib/utils";
import { quickToggleListing } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin/Fields";
import { ListingCover } from "@/components/site/ListingCard";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const items = await getListings({ includeInactive: true, search: q });
  return (
    <>
      <AdminTitle title="İlanlar" sub={`${items.length} ilan`}>
        <Link href="/admin/ilanlar/yeni" className="btn-ember"><Plus className="h-4 w-4" /> Yeni ilan</Link>
      </AdminTitle>
      <form className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
        <input name="q" defaultValue={q} placeholder="İlan veya kategori ara" className="input pl-9" />
      </form>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-left text-xs text-mute">
            <tr className="border-b border-line">
              <th className="p-3 pl-4 font-semibold">İlan</th>
              <th className="p-3 font-semibold">Fiyat</th>
              <th className="p-3 font-semibold">Stok</th>
              <th className="p-3 font-semibold">Satış</th>
              <th className="p-3 font-semibold">Durum</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((l) => {
              const pct = discountPct(l.price, l.old_price);
              return (
                <tr key={l.id} className={l.active ? "" : "opacity-50"}>
                  <td className="p-3 pl-4">
                    <Link href={`/admin/ilanlar/${l.id}`} className="flex items-center gap-3">
                      <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg"><ListingCover l={l} mini /></span>
                      <span>
                        <span className="block font-semibold hover:text-ember">{l.title}</span>
                        <span className="text-xs text-mute">{l.category_name ?? "Kategorisiz"}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="font-display font-bold">{tl(l.price)}</div>
                    {pct > 0 && <div className="text-xs text-mute"><s>{tl(l.old_price)}</s> <span className="text-plasma">-%{pct}</span></div>}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 font-semibold ${l.stock < 5 ? "text-plasma" : ""}`}>
                      {l.delivery_type === "auto" ? <Zap className="h-3.5 w-3.5 text-mint" /> : <Hand className="h-3.5 w-3.5 text-blaze" />}
                      {l.stock}
                    </span>
                  </td>
                  <td className="p-3 text-mute">{l.sold_count}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <form action={quickToggleListing}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="field" value="active" />
                        <button title={l.active ? "Satıştan kaldır" : "Satışa aç"} className={`grid h-8 w-8 place-items-center rounded-lg border border-line ${l.active ? "text-mint" : "text-mute"}`}>
                          {l.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </form>
                      <form action={quickToggleListing}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="field" value="featured" />
                        <button title="Öne çıkar" className={`grid h-8 w-8 place-items-center rounded-lg border border-line ${l.featured ? "text-blaze" : "text-mute"}`}>
                          <Star className={`h-4 w-4 ${l.featured ? "fill-blaze" : ""}`} />
                        </button>
                      </form>
                    </div>
                  </td>
                  <td className="p-3 pr-4 text-right">
                    <Link href={`/admin/ilanlar/${l.id}`} className="btn-ghost px-3 py-1.5 text-xs"><Pencil className="h-3.5 w-3.5" /> Düzenle</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!items.length && <p className="p-8 text-center text-sm text-mute">İlan bulunamadı.</p>}
      </div>
    </>
  );
}
