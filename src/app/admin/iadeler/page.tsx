import Link from "next/link";
import { Check, X } from "lucide-react";
import { q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { resolveRefund } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin/Fields";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmSubmit } from "@/components/admin/Confirm";

export default async function Page({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  const { durum = "pending" } = await searchParams;
  const rows = await q<any>(
    `SELECT r.*, u.username, oi.title, oi.order_id, oi.quantity, oi.unit_price, oi.delivered_content
     FROM refund_requests r JOIN users u ON u.id = r.user_id JOIN order_items oi ON oi.id = r.order_item_id
     ${durum !== "all" ? "WHERE r.status = $1" : ""} ORDER BY r.id DESC LIMIT 200`,
    durum !== "all" ? [durum] : [],
  );
  return (
    <>
      <AdminTitle title="İade talepleri" sub="Onaylanan iadede ürün tutarı üyenin bakiyesine geri yüklenir." />
      <div className="mb-4 flex flex-wrap gap-2">
        {[["pending", "Bekleyen"], ["approved", "Onaylanan"], ["rejected", "Reddedilen"], ["all", "Tümü"]].map(([k, l]) => (
          <Link key={k} href={`/admin/iadeler?durum=${k}`} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${durum === k ? "border-ember bg-ember text-void" : "border-line bg-ash"}`}>{l}</Link>
        ))}
      </div>
      <div className="grid gap-3">
        {rows.map((r) => (
          <div key={r.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold">{r.title}</span>
              <span className="text-mute">#{r.order_id} · {r.quantity} adet</span>
              <Link href={`/admin/uyeler/${r.user_id}`} className="text-ember hover:underline">{r.username}</Link>
              <span className="text-xs text-mute">{dateTimeTR(r.created_at)}</span>
              <span className="ml-auto font-display font-bold">{tl(r.unit_price * r.quantity)}</span>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-2 rounded-lg bg-coal p-3 text-sm">{r.reason}</p>
            {r.delivered_content && <p className="mt-2 font-mono text-xs text-mute">Teslim edilen: {r.delivered_content.split("\n").join(", ")}</p>}
            {r.admin_note && <p className="mt-2 text-sm text-mute">Not: {r.admin_note}</p>}
            {r.status === "pending" && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <form action={resolveRefund} className="flex flex-1 flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <input name="admin_note" className="input flex-1" placeholder="Üyeye not (isteğe bağlı)" />
                  <ConfirmSubmit message={"İade reddedilsin mi?"} className="btn-danger"><X className="h-4 w-4" /> Reddet</ConfirmSubmit>
                </form>
                <form action={resolveRefund}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <ConfirmSubmit message={"İade onaylansın ve tutar bakiyeye eklensin mi?"} className="btn w-full bg-mint text-void"><Check className="h-4 w-4" /> Onayla</ConfirmSubmit>
                </form>
              </div>
            )}
          </div>
        ))}
        {!rows.length && <p className="panel p-10 text-center text-sm text-mute">Bu filtrede iade talebi yok.</p>}
      </div>
    </>
  );
}
