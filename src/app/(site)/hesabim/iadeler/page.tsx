import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "İade taleplerim" };

export default async function Page() {
  const u = await requireUser("/hesabim/iadeler");
  const rows = await q<{ id: number; reason: string; status: string; admin_note: string | null; created_at: string; title: string; order_id: number; amount: number }>(
    `SELECT r.*, oi.title, oi.order_id, oi.unit_price * oi.quantity AS amount FROM refund_requests r JOIN order_items oi ON oi.id = r.order_item_id WHERE r.user_id = $1 ORDER BY r.id DESC`,
    [u.id],
  );
  return (
    <div className="panel">
      <div className="border-b border-line p-5">
        <h1 className="font-display text-xl font-bold">İade taleplerim</h1>
        <p className="mt-1 text-sm text-mute">İade talebini sipariş detay sayfasından oluşturabilirsin. Onaylanan iadeler bakiyene eklenir.</p>
      </div>
      {rows.length ? (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-2 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/hesabim/siparisler/${r.order_id}`} className="font-bold hover:text-ember">{r.title}</Link>
                <span className="text-sm text-mute">#{r.order_id}</span>
                <span className="ml-auto font-display text-sm font-bold">{tl(r.amount)}</span>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-sm text-bone/75">{r.reason}</p>
              {r.admin_note && <p className="rounded-lg bg-smoke/60 p-2.5 text-sm">Ekip notu: {r.admin_note}</p>}
              <span className="text-xs text-mute">{dateTimeTR(r.created_at)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-12 text-center text-sm text-mute">İade talebin bulunmuyor.</div>
      )}
    </div>
  );
}
