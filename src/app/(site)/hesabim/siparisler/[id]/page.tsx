import Link from "next/link";
import { notFound } from "next/navigation";
import { PartyPopper, KeyRound, Hourglass, LifeBuoy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { RefundForm } from "@/components/site/RefundForm";

export const metadata = { title: "Sipariş detayı" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ yeni?: string }> }) {
  const { id } = await params;
  const { yeni } = await searchParams;
  const u = await requireUser(`/hesabim/siparisler/${id}`);
  const order = await one<{ id: number; total: number; created_at: string }>("SELECT * FROM orders WHERE id = $1 AND user_id = $2", [Number(id) || 0, u.id]);
  if (!order) notFound();
  const items = await q<{
    id: number; title: string; quantity: number; unit_price: number; status: string; delivery_type: string; delivered_content: string | null; refund_status: string | null; refund_note: string | null;
  }>(
    `SELECT oi.*, (SELECT r.status FROM refund_requests r WHERE r.order_item_id = oi.id ORDER BY r.id DESC LIMIT 1) AS refund_status,
            (SELECT r.admin_note FROM refund_requests r WHERE r.order_item_id = oi.id ORDER BY r.id DESC LIMIT 1) AS refund_note
     FROM order_items oi WHERE oi.order_id = $1 ORDER BY oi.id`,
    [order.id],
  );
  return (
    <div className="grid gap-5">
      {yeni && (
        <div className="flex items-center gap-4 rounded-2xl border border-mint/30 bg-mint/10 p-5">
          <PartyPopper className="h-8 w-8 shrink-0 text-mint" />
          <div>
            <div className="font-display font-bold text-mint">Siparişin tamamlandı</div>
            <div className="text-sm text-bone/80">Otomatik teslimatlı kodların aşağıda. Kopyalayıp hemen kullanabilirsin.</div>
          </div>
        </div>
      )}
      <div className="panel flex flex-wrap items-center gap-x-8 gap-y-2 p-5">
        <h1 className="font-display text-xl font-bold">Sipariş #{order.id}</h1>
        <span className="text-sm text-mute">{dateTimeTR(order.created_at)}</span>
        <span className="ml-auto font-display text-lg font-extrabold text-blaze">{tl(order.total)}</span>
      </div>
      {items.map((i) => {
        const codes = (i.delivered_content ?? "").split("\n").filter(Boolean);
        return (
          <div key={i.id} className="panel overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-line p-5">
              <div className="min-w-0 flex-1">
                <div className="font-bold">{i.title}</div>
                <div className="text-sm text-mute">{i.quantity} adet × {tl(i.unit_price)}</div>
              </div>
              <StatusBadge status={i.status} />
              {i.refund_status && <StatusBadge status={i.refund_status} label={`İade: ${i.refund_status === "pending" ? "inceleniyor" : i.refund_status === "approved" ? "onaylandı" : "reddedildi"}`} />}
            </div>
            <div className="p-5">
              {i.status === "delivered" && codes.length > 0 ? (
                <div className="grid gap-2">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-mute"><KeyRound className="h-4 w-4 text-ember" /> Teslim edilen {i.delivery_type === "auto" ? "kodlar" : "bilgiler"}</div>
                  {codes.map((c, k) => (
                    <div key={k} className="flex items-center gap-3 rounded-xl border border-dashed border-ember/40 bg-ember/5 px-4 py-3">
                      <code className="flex-1 break-all font-display text-sm font-bold tracking-wider text-bone">{c}</code>
                      <CopyButton text={c} />
                    </div>
                  ))}
                </div>
              ) : i.status === "pending" ? (
                <div className="flex items-start gap-3 text-sm text-mute">
                  <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-blaze" />
                  <span>Bu ürün manuel teslim ediliyor. Hesap bilgini iletmek için <Link href={`/destek?siparis=${order.id}`} className="font-semibold text-ember">destek talebi aç</Link>.</span>
                </div>
              ) : (
                <div className="text-sm text-mute">Bu ürün iade edildi, tutar bakiyene eklendi.</div>
              )}
              {i.refund_note && <p className="mt-3 rounded-xl bg-smoke/60 p-3 text-sm text-bone/80">Ekip notu: {i.refund_note}</p>}
              {i.refund_status === "pending" && <p className="mt-4 text-sm text-blaze">İade talebin alındı, ekibimiz inceliyor. Sonuç burada ve İade taleplerim sayfasında görünecek.</p>}
              {i.status !== "refunded" && i.refund_status !== "pending" && <RefundForm itemId={i.id} />}
            </div>
          </div>
        );
      })}
      <Link href={`/destek?siparis=${order.id}`} className="btn-ghost w-fit"><LifeBuoy className="h-4 w-4" /> Bu siparişle ilgili destek al</Link>
    </div>
  );
}
