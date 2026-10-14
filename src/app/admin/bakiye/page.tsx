import Link from "next/link";
import { Check, X } from "lucide-react";
import { q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { resolveDeposit } from "@/app/actions/admin";
import { AdminTitle } from "@/components/admin/Fields";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmSubmit } from "@/components/admin/Confirm";

export default async function Page({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  const { durum = "pending" } = await searchParams;
  const rows = await q<any>(
    `SELECT d.*, u.username, u.email FROM deposits d JOIN users u ON u.id = d.user_id ${durum !== "all" ? "WHERE d.status = $1" : ""} ORDER BY d.id DESC LIMIT 200`,
    durum !== "all" ? [durum] : [],
  );
  return (
    <>
      <AdminTitle title="Bakiye talepleri" sub="Hesabına gelen ödemeyi kontrol et, onaylayınca tutar üyenin bakiyesine eklenir." />
      <div className="mb-4 flex flex-wrap gap-2">
        {[["pending", "Bekleyen"], ["approved", "Onaylanan"], ["rejected", "Reddedilen"], ["all", "Tümü"]].map(([k, l]) => (
          <Link key={k} href={`/admin/bakiye?durum=${k}`} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${durum === k ? "border-ember bg-ember text-void" : "border-line bg-ash"}`}>{l}</Link>
        ))}
      </div>
      <div className="grid gap-3">
        {rows.map((d) => (
          <div key={d.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <span className="font-display text-xl font-extrabold text-blaze">{tl(d.amount)}</span>
              <span className="font-semibold">{d.method_name}</span>
              <Link href={`/admin/uyeler/${d.user_id}`} className="text-sm text-ember hover:underline">{d.username}</Link>
              <span className="text-sm text-mute">Gönderen: <b className="text-bone">{d.sender_name}</b></span>
              <span className="text-xs text-mute">{dateTimeTR(d.created_at)}</span>
              <span className="ml-auto"><StatusBadge status={d.status} /></span>
            </div>
            {d.note && <p className="mt-2 text-sm text-mute">Not: {d.note}</p>}
            {d.admin_note && <p className="mt-1 text-sm text-mute">Yönetici notu: {d.admin_note}</p>}
            {d.status === "pending" && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <form action={resolveDeposit} className="flex flex-1 flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <input name="admin_note" className="input flex-1" placeholder="Red nedeni (üyeye görünür)" />
                  <ConfirmSubmit message={"Bildirim reddedilsin mi?"} className="btn-danger"><X className="h-4 w-4" /> Reddet</ConfirmSubmit>
                </form>
                <form action={resolveDeposit}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <ConfirmSubmit message={`${tl(d.amount)} ${d.username} hesabına eklensin mi?`} className="btn w-full bg-mint text-void"><Check className="h-4 w-4" /> Onayla</ConfirmSubmit>
                </form>
              </div>
            )}
          </div>
        ))}
        {!rows.length && <p className="panel p-10 text-center text-sm text-mute">Bu filtrede talep yok.</p>}
      </div>
    </>
  );
}
