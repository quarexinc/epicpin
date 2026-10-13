import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";

export const metadata = { title: "Hesabım" };

export default async function Page() {
  const u = await requireUser("/hesabim");
  const [stats, orders, tickets] = await Promise.all([
    one<{ c: number; s: number }>("SELECT COUNT(*)::int AS c, COALESCE(SUM(total),0) AS s FROM orders WHERE user_id = $1", [u.id]),
    q<{ id: number; total: number; created_at: string; items: string }>(
      "SELECT o.id, o.total, o.created_at, string_agg(oi.title, ', ') AS items FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.id DESC LIMIT 5",
      [u.id],
    ),
    one<{ c: number }>("SELECT COUNT(*)::int AS c FROM tickets WHERE user_id = $1 AND status <> 'closed'", [u.id]),
  ]);
  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blaze to-ember p-5 text-void">
          <div className="text-sm font-semibold opacity-80">Bakiyen</div>
          <div className="mt-1 font-display text-3xl font-extrabold">{tl(u.balance)}</div>
          <Link href="/bakiye-yukle" className="mt-3 inline-flex rounded-lg bg-void px-3 py-1.5 text-xs font-bold text-bone">Bakiye yükle</Link>
        </div>
        <div className="panel p-5">
          <div className="text-sm text-mute">Siparişler</div>
          <div className="mt-1 font-display text-3xl font-extrabold">{stats?.c ?? 0}</div>
          <div className="mt-3 text-xs text-mute">Toplam harcama {tl(stats?.s)}</div>
        </div>
        <div className="panel p-5">
          <div className="text-sm text-mute">Açık destek talebi</div>
          <div className="mt-1 font-display text-3xl font-extrabold">{tickets?.c ?? 0}</div>
          <Link href="/destek" className="mt-3 inline-block text-xs font-semibold text-ember">Taleplerimi gör</Link>
        </div>
      </div>
      <div className="panel">
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="font-display font-bold">Son siparişler</h2>
          <Link href="/hesabim/siparisler" className="text-sm font-semibold text-ember">Tümü</Link>
        </div>
        {orders.length ? (
          <ul className="divide-y divide-line">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/hesabim/siparisler/${o.id}`} className="flex items-center gap-4 p-5 hover:bg-smoke/50">
                  <span className="font-display text-sm font-bold text-mute">#{o.id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{o.items}</span>
                  <span className="hidden text-xs text-mute sm:block">{dateTimeTR(o.created_at)}</span>
                  <span className="font-display text-sm font-bold">{tl(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center text-sm text-mute">
            Henüz siparişin yok. <Link href="/ilanlar" className="font-semibold text-ember">İlk kodunu al</Link>
          </div>
        )}
      </div>
      <p className="text-xs text-mute">Üyelik e-postan: {u.email}</p>
    </div>
  );
}
