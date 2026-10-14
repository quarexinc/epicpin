import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Undo2 } from "lucide-react";
import { one, q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { adminRefundItem, deliverItem } from "@/app/actions/admin";
import { AdminTitle, Card } from "@/components/admin/Fields";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmSubmit } from "@/components/admin/Confirm";
import { Submit } from "@/components/FormBits";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id) || 0;
  const o = await one<any>("SELECT o.*, u.username, u.email, u.balance FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1", [id]);
  if (!o) notFound();
  const items = await q<any>(
    `SELECT oi.*, l.slug, (SELECT r.status FROM refund_requests r WHERE r.order_item_id = oi.id ORDER BY r.id DESC LIMIT 1) AS refund_status
     FROM order_items oi LEFT JOIN listings l ON l.id = oi.listing_id WHERE oi.order_id = $1 ORDER BY oi.id`,
    [id],
  );
  const back = `/admin/siparisler/${id}`;
  return (
    <>
      <Link href="/admin/siparisler" className="mb-3 inline-flex items-center gap-1.5 text-sm text-mute hover:text-bone"><ArrowLeft className="h-4 w-4" /> Siparişler</Link>
      <AdminTitle title={`Sipariş #${o.id}`} sub={dateTimeTR(o.created_at)} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          {items.map((i) => (
            <Card key={i.id}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  {i.slug ? <Link href={`/admin/ilanlar/${i.listing_id}`} className="font-semibold hover:text-ember">{i.title}</Link> : <span className="font-semibold">{i.title}</span>}
                  <div className="text-sm text-mute">{i.quantity} × {tl(i.unit_price)} ({i.delivery_type === "auto" ? "otomatik" : "manuel"})</div>
                </div>
                <StatusBadge status={i.status} />
                {i.refund_status === "pending" && <Link href="/admin/iadeler"><StatusBadge status="pending" label="İade talebi var" /></Link>}
              </div>
              {i.delivered_content && <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-coal p-3 font-mono text-xs">{i.delivered_content}</pre>}
              {i.status === "pending" && (
                <form action={deliverItem} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={i.id} />
                  <input name="content" className="input flex-1" placeholder="Teslim notu veya kod" required />
                  <Submit className="btn-ember">Teslim et</Submit>
                </form>
              )}
              {i.status !== "refunded" && (
                <form action={adminRefundItem} className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                  <input type="hidden" name="id" value={i.id} />
                  <input type="hidden" name="back" value={back} />
                  {i.delivery_type === "auto" && i.status === "delivered" && (
                    <label className="flex items-center gap-2 text-xs text-mute">
                      <input type="checkbox" name="restock" className="accent-[#FF6A13]" /> Kodları stoğa geri al (kullanılmadıysa)
                    </label>
                  )}
                  <ConfirmSubmit message="Bu ürün iade edilsin ve ödenen tutar üyenin bakiyesine eklensin mi?" className="btn-danger ml-auto px-3 py-1.5 text-xs">
                    <Undo2 className="h-3.5 w-3.5" /> İade et
                  </ConfirmSubmit>
                </form>
              )}
            </Card>
          ))}
        </div>
        <div className="grid gap-4">
          <Card title="Müşteri">
            <Link href={`/admin/uyeler/${o.user_id}`} className="font-semibold text-ember hover:underline">{o.username}</Link>
            <div className="text-sm text-mute">{o.email}</div>
            <div className="mt-2 text-sm">Bakiye: <b>{tl(o.balance)}</b></div>
          </Card>
          <Card title="Ödeme">
            <dl className="grid gap-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-mute">Ara toplam</dt><dd>{tl(o.subtotal ?? o.total)}</dd></div>
              {Number(o.discount) > 0 && <div className="flex justify-between text-mint"><dt>Kupon {o.coupon_code}</dt><dd>-{tl(o.discount)}</dd></div>}
              <div className="flex justify-between border-t border-line pt-1.5 font-bold"><dt>Ödenen</dt><dd>{tl(o.total)}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
