import Link from "next/link";
import { Download, ChevronRight } from "lucide-react";
import { q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { deliverItem } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin/Fields";
import { StatusBadge } from "@/components/StatusBadge";
import { Submit } from "@/components/FormBits";

const TABS: [string, string][] = [["", "Tümü"], ["pending", "Teslim bekleyen"], ["delivered", "Teslim edildi"], ["refunded", "İade edildi"]];

export default async function Page({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  const { durum = "" } = await searchParams;
  const rows = await q<any>(
    `SELECT oi.*, o.created_at, o.user_id, u.username FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN users u ON u.id = o.user_id
     ${durum ? "WHERE oi.status = $1" : ""} ORDER BY oi.id DESC LIMIT 300`,
    durum ? [durum] : [],
  );
  return (
    <>
      <AdminTitle title="Siparişler" sub="Otomatik ürünler ödeme anında teslim edilir. Manuel ürünleri buradan teslim et.">
        <a href="/admin/disa-aktar/siparisler" className="btn-ghost"><Download className="h-4 w-4" /> Excel (CSV) indir</a>
      </AdminTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin/siparisler${k ? `?durum=${k}` : ""}`} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${durum === k ? "border-ember bg-ember text-void" : "border-line bg-ash"}`}>{l}</Link>
        ))}
      </div>
      <div className="grid gap-3">
        {rows.map((r) => (
          <div key={r.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <Link href={`/admin/siparisler/${r.order_id}`} className="font-display font-bold text-ember hover:underline">#{r.order_id}</Link>
              <span className="font-semibold">{r.title}</span>
              <span className="text-mute">× {r.quantity}</span>
              <Link href={`/admin/uyeler/${r.user_id}`} className="text-ember hover:underline">{r.username}</Link>
              <span className="text-mute">{dateTimeTR(r.created_at)}</span>
              <span className="ml-auto font-display font-bold">{tl(r.unit_price * r.quantity)}</span>
              <StatusBadge status={r.status} />
              <Link href={`/admin/siparisler/${r.order_id}`} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mute hover:border-ember hover:text-ember" aria-label="Sipariş detayı"><ChevronRight className="h-4 w-4" /></Link>
            </div>
            {r.status === "pending" && (
              <form action={deliverItem} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="id" value={r.id} />
                <input name="content" className="input flex-1" placeholder="Teslim notu veya kod (üye sipariş sayfasında görür)" required />
                <Submit className="btn-ember">Teslim et</Submit>
              </form>
            )}
            {r.status === "delivered" && r.delivered_content && (
              <details className="mt-2 text-xs text-mute">
                <summary className="cursor-pointer">Teslim edilen içerik</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-coal p-3 font-mono">{r.delivered_content}</pre>
              </details>
            )}
          </div>
        ))}
        {!rows.length && <p className="panel p-10 text-center text-sm text-mute">Bu filtrede sipariş yok.</p>}
      </div>
    </>
  );
}
