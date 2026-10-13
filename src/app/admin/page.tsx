import Link from "next/link";
import { TrendingUp, ShoppingBag, Users, Wallet, Undo2, LifeBuoy, PackageX, Hand } from "lucide-react";
import { one, q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { AdminTitle, Card } from "@/components/admin/Fields";

export default async function Dashboard() {
  const s = await one<any>(`SELECT
    (SELECT COALESCE(SUM(total),0) FROM orders WHERE created_at >= date_trunc('day', now())) AS rev_today,
    (SELECT COALESCE(SUM(total),0) FROM orders WHERE created_at >= now() - interval '30 days') AS rev_30,
    (SELECT COUNT(*)::int FROM orders) AS orders,
    (SELECT COUNT(*)::int FROM orders WHERE created_at >= date_trunc('day', now())) AS orders_today,
    (SELECT COUNT(*)::int FROM users) AS users,
    (SELECT COUNT(*)::int FROM users WHERE created_at >= now() - interval '7 days') AS users_7,
    (SELECT COUNT(*)::int FROM deposits WHERE status = 'pending') AS deposits,
    (SELECT COUNT(*)::int FROM refund_requests WHERE status = 'pending') AS refunds,
    (SELECT COUNT(*)::int FROM tickets WHERE status IN ('open','customer_reply')) AS tickets,
    (SELECT COUNT(*)::int FROM order_items WHERE status = 'pending') AS manual`);
  const [recent, low, days] = await Promise.all([
    q<any>(`SELECT o.id, o.total, o.created_at, u.username, string_agg(oi.title, ', ') AS items FROM orders o JOIN users u ON u.id = o.user_id JOIN order_items oi ON oi.order_id = o.id GROUP BY o.id, u.username ORDER BY o.id DESC LIMIT 8`),
    q<any>(`SELECT l.id, l.title, (SELECT COUNT(*)::int FROM stock_codes s WHERE s.listing_id = l.id AND s.order_item_id IS NULL) AS stock FROM listings l WHERE l.active AND l.delivery_type = 'auto' ORDER BY stock ASC LIMIT 6`),
    q<any>(`SELECT to_char(d, 'DD.MM') AS day, COALESCE((SELECT SUM(total) FROM orders WHERE created_at::date = d::date),0) AS total
            FROM generate_series(current_date - 13, current_date, interval '1 day') d ORDER BY d`),
  ]);
  const max = Math.max(1, ...days.map((d: any) => Number(d.total)));
  const stats: [any, string, string, string?, string?][] = [
    [TrendingUp, "Bugünkü ciro", tl(s.rev_today), `Son 30 gün ${tl(s.rev_30)}`],
    [ShoppingBag, "Siparişler", String(s.orders), `Bugün ${s.orders_today}`, "/admin/siparisler"],
    [Users, "Üyeler", String(s.users), `Son 7 gün +${s.users_7}`, "/admin/uyeler"],
  ];
  const todo: [any, string, number, string][] = [
    [Wallet, "Onay bekleyen ödeme", s.deposits, "/admin/bakiye"],
    [Hand, "Manuel teslim bekleyen", s.manual, "/admin/siparisler?durum=pending"],
    [Undo2, "İade talebi", s.refunds, "/admin/iadeler"],
    [LifeBuoy, "Yanıt bekleyen destek", s.tickets, "/admin/destek"],
  ];
  return (
    <>
      <AdminTitle title="Panel" sub="Mağazanın bugünkü durumu." />
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(([I, label, val, sub, href]) => {
          const inner = (
            <div className="panel h-full p-5 transition hover:border-ember/40">
              <div className="flex items-center gap-2 text-sm text-mute"><I className="h-4 w-4 text-ember" /> {label}</div>
              <div className="mt-2 font-display text-3xl font-extrabold">{val}</div>
              {sub && <div className="mt-1 text-xs text-mute">{sub}</div>}
            </div>
          );
          return href ? <Link key={label} href={href}>{inner}</Link> : <div key={label}>{inner}</div>;
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {todo.map(([I, label, n, href]) => (
          <Link key={label} href={href} className={`flex items-center gap-3 rounded-2xl border p-4 transition ${n > 0 ? "border-ember/40 bg-ember/10 hover:bg-ember/15" : "border-line bg-ash/60 hover:border-mute"}`}>
            <I className={`h-5 w-5 ${n > 0 ? "text-ember" : "text-mute"}`} />
            <span className="flex-1 text-sm font-semibold">{label}</span>
            <span className="font-display text-xl font-extrabold">{n}</span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card title="Son 14 gün ciro">
          <div className="flex h-48 items-end gap-1.5">
            {days.map((d: any) => (
              <div key={d.day} className="group flex h-full flex-1 flex-col justify-end">
                <div className="relative w-full rounded-t-md bg-gradient-to-t from-ember to-blaze transition group-hover:brightness-125" style={{ height: `${Math.max(2, (Number(d.total) / max) * 100)}%` }}>
                  <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-void px-2 py-1 text-[11px] font-bold group-hover:block">{tl(d.total)}</span>
                </div>
                <span className="mt-1.5 text-center text-[10px] text-mute">{d.day}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Stoğu azalanlar" actions={<Link href="/admin/ilanlar" className="text-xs font-semibold text-ember">İlanlar</Link>}>
          <ul className="grid gap-2">
            {low.map((l: any) => (
              <li key={l.id}>
                <Link href={`/admin/ilanlar/${l.id}`} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-smoke">
                  {l.stock === 0 && <PackageX className="h-4 w-4 text-plasma" />}
                  <span className="flex-1 truncate">{l.title}</span>
                  <span className={`font-display text-xs font-bold ${l.stock < 5 ? "text-plasma" : "text-mute"}`}>{l.stock} kod</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Son siparişler" className="mt-4" actions={<Link href="/admin/siparisler" className="text-xs font-semibold text-ember">Tümü</Link>}>
        {recent.length ? (
          <div className="-m-5 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <tbody className="divide-y divide-line">
                {recent.map((o: any) => (
                  <tr key={o.id}>
                    <td className="p-4 font-display font-bold text-mute">#{o.id}</td>
                    <td className="p-4 font-semibold">{o.username}</td>
                    <td className="max-w-xs truncate p-4 text-bone/80">{o.items}</td>
                    <td className="p-4 text-mute">{dateTimeTR(o.created_at)}</td>
                    <td className="p-4 text-right font-display font-bold">{tl(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-mute">Henüz sipariş yok.</p>
        )}
      </Card>
    </>
  );
}
