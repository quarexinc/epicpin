import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Siparişlerim" };

export default async function Page() {
  const u = await requireUser("/hesabim/siparisler");
  const items = await q<{ id: number; order_id: number; title: string; quantity: number; unit_price: number; status: string; created_at: string }>(
    "SELECT oi.id, oi.order_id, oi.title, oi.quantity, oi.unit_price, oi.status, o.created_at FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.user_id = $1 ORDER BY o.id DESC, oi.id",
    [u.id],
  );
  return (
    <div className="panel">
      <div className="border-b border-line p-5">
        <h1 className="font-display text-xl font-bold">Siparişlerim</h1>
      </div>
      {items.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-mute">
              <tr className="border-b border-line">
                <th className="p-4 font-semibold">Sipariş</th>
                <th className="p-4 font-semibold">Ürün</th>
                <th className="p-4 font-semibold">Adet</th>
                <th className="p-4 font-semibold">Tutar</th>
                <th className="p-4 font-semibold">Durum</th>
                <th className="p-4 font-semibold">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-smoke/40">
                  <td className="p-4"><Link href={`/hesabim/siparisler/${i.order_id}`} className="font-display font-bold text-ember">#{i.order_id}</Link></td>
                  <td className="p-4"><Link href={`/hesabim/siparisler/${i.order_id}`} className="hover:text-ember">{i.title}</Link></td>
                  <td className="p-4">{i.quantity}</td>
                  <td className="p-4 font-semibold">{tl(i.unit_price * i.quantity)}</td>
                  <td className="p-4"><StatusBadge status={i.status} /></td>
                  <td className="p-4 text-mute">{dateTimeTR(i.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid place-items-center p-16 text-center">
          <Package className="h-10 w-10 text-mute" />
          <p className="mt-3 text-sm text-mute">Henüz siparişin yok.</p>
          <Link href="/ilanlar" className="btn-ember mt-4">Ürünlere göz at</Link>
        </div>
      )}
    </div>
  );
}
