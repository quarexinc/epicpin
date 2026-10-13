import Link from "next/link";
import { q } from "@/lib/db";
import { dateTimeTR } from "@/lib/utils";
import { AdminTitle } from "@/components/admin/Fields";
import { StatusBadge } from "@/components/StatusBadge";

export default async function Page({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  const { durum = "acik" } = await searchParams;
  const rows = await q<any>(
    `SELECT t.*, u.username, (SELECT COUNT(*)::int FROM ticket_messages m WHERE m.ticket_id = t.id) AS msgs FROM tickets t JOIN users u ON u.id = t.user_id
     ${durum === "acik" ? "WHERE t.status IN ('open','customer_reply')" : durum === "tum" ? "" : "WHERE t.status = 'closed'"} ORDER BY t.updated_at DESC LIMIT 200`,
  );
  return (
    <>
      <AdminTitle title="Destek talepleri" />
      <div className="mb-4 flex gap-2">
        {[["acik", "Yanıt bekleyen"], ["kapali", "Kapalı"], ["tum", "Tümü"]].map(([k, l]) => (
          <Link key={k} href={`/admin/destek?durum=${k}`} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${durum === k ? "border-ember bg-ember text-void" : "border-line bg-ash"}`}>{l}</Link>
        ))}
      </div>
      <div className="panel divide-y divide-line">
        {rows.map((t) => (
          <Link key={t.id} href={`/admin/destek/${t.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:bg-smoke/40">
            <span className="font-display text-sm font-bold text-mute">#{t.id}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{t.subject}</span>
            <span className="text-sm text-ember">{t.username}</span>
            <span className="text-xs text-mute">{t.msgs} mesaj</span>
            <span className="text-xs text-mute">{dateTimeTR(t.updated_at)}</span>
            <StatusBadge status={t.status} />
          </Link>
        ))}
        {!rows.length && <p className="p-10 text-center text-sm text-mute">Talep yok.</p>}
      </div>
    </>
  );
}
