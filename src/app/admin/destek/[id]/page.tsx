import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { one, q } from "@/lib/db";
import { dateTimeTR } from "@/lib/utils";
import { staffReply } from "@/app/actions/admin";
import { AdminTitle, Card, Field } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";
import { StatusBadge } from "@/components/StatusBadge";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id) || 0;
  const t = await one<any>("SELECT t.*, u.username, u.email FROM tickets t JOIN users u ON u.id = t.user_id WHERE t.id = $1", [id]);
  if (!t) notFound();
  const msgs = await q<any>("SELECT m.*, u.username FROM ticket_messages m LEFT JOIN users u ON u.id = m.user_id WHERE ticket_id = $1 ORDER BY m.id", [id]);
  return (
    <>
      <Link href="/admin/destek" className="mb-3 inline-flex items-center gap-1.5 text-sm text-mute hover:text-bone"><ArrowLeft className="h-4 w-4" /> Destek</Link>
      <AdminTitle title={`#${t.id} ${t.subject}`} sub={`${t.username} (${t.email})`}>
        <StatusBadge status={t.status} />
      </AdminTitle>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-3">
          {msgs.map((m) => (
            <div key={m.id} className={`rounded-2xl p-4 text-sm ${m.is_staff ? "ml-10 border border-ember/30 bg-ember/10" : "mr-10 bg-ash"}`}>
              <div className="mb-1 text-xs font-semibold text-mute">{m.is_staff ? `Destek (${m.username ?? "yönetici"})` : m.username} · {dateTimeTR(m.created_at)}</div>
              <p className="whitespace-pre-line leading-6">{m.message}</p>
            </div>
          ))}
        </div>
        <Card title="Yanıtla" className="lg:sticky lg:top-6">
          {t.order_id && <Link href={`/admin/siparisler`} className="mb-4 block text-sm text-ember">İlgili sipariş #{t.order_id}</Link>}
          <AForm action={staffReply} submit="Gönder">
            <input type="hidden" name="ticket_id" value={t.id} />
            <Field label="Mesaj"><textarea name="message" rows={6} className="input" /></Field>
            <Field label="Yeni durum">
              <select name="status" className="input" defaultValue="answered">
                <option value="answered">Yanıtlandı</option>
                <option value="open">Açık</option>
                <option value="closed">Kapat</option>
              </select>
            </Field>
          </AForm>
        </Card>
      </div>
    </>
  );
}
