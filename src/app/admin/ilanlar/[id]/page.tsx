import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash2, X } from "lucide-react";
import { one, q } from "@/lib/db";
import { getCategories, LISTING_SELECT, type Listing } from "@/lib/data";
import { deleteListing, deleteStockCode } from "@/app/actions/admin";
import { AdminTitle, Card } from "@/components/admin/Fields";
import { ListingForm } from "@/components/admin/ListingForm";
import { ConfirmSubmit } from "@/components/admin/Confirm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const l = await one<Listing>(`${LISTING_SELECT} WHERE l.id = $1`, [id || 0]);
  if (!l) notFound();
  const [cats, codes, used] = await Promise.all([
    getCategories(true),
    q<{ id: number; code: string }>("SELECT id, code FROM stock_codes WHERE listing_id = $1 AND order_item_id IS NULL ORDER BY id LIMIT 300", [l.id]),
    one<{ c: number }>("SELECT COUNT(*)::int AS c FROM stock_codes WHERE listing_id = $1 AND order_item_id IS NOT NULL", [l.id]),
  ]);
  return (
    <>
      <Link href="/admin/ilanlar" className="mb-3 inline-flex items-center gap-1.5 text-sm text-mute hover:text-bone"><ArrowLeft className="h-4 w-4" /> İlanlar</Link>
      <AdminTitle title={l.title} sub={`#${l.id} · ${l.sold_count} satış`}>
        <Link href={`/ilan/${l.slug}`} target="_blank" className="btn-ghost"><ExternalLink className="h-4 w-4" /> Sitede gör</Link>
        <form action={deleteListing}>
          <input type="hidden" name="id" value={l.id} />
          <ConfirmSubmit message="Bu ilan silinsin mi? Satış geçmişi varsa pasife alınır.">
            <Trash2 className="h-4 w-4" /> Sil
          </ConfirmSubmit>
        </form>
      </AdminTitle>
      <ListingForm l={l} cats={cats} />
      {l.delivery_type === "auto" && (
        <Card title={`Stoktaki kodlar (${codes.length})`} className="mt-5" actions={<span className="text-xs text-mute">{used?.c ?? 0} kod teslim edildi</span>}>
          {codes.length ? (
            <div className="grid max-h-[420px] gap-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {codes.map((c) => (
                <form key={c.id} action={deleteStockCode} className="flex items-center gap-2 rounded-lg border border-line bg-coal px-3 py-2">
                  <input type="hidden" name="code_id" value={c.id} />
                  <input type="hidden" name="listing_id" value={l.id} />
                  <code className="flex-1 truncate font-mono text-xs">{c.code}</code>
                  <button className="text-mute hover:text-plasma" title="Kodu sil"><X className="h-4 w-4" /></button>
                </form>
              ))}
            </div>
          ) : (
            <p className="text-sm text-plasma">Stokta kod yok. Yukarıdaki alandan kod ekle, yoksa ürün &quot;Stokta yok&quot; görünür.</p>
          )}
        </Card>
      )}
    </>
  );
}
