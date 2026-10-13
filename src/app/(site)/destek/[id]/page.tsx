import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { dateTimeTR } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { ReplyForm } from "@/components/site/TicketForms";
import { closeTicketAction } from "@/app/actions/user";
import { Submit } from "@/components/FormBits";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Destek talebi" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requireUser(`/destek/${id}`);
  const t = await one<{ id: number; subject: string; status: string; order_id: number | null; created_at: string }>("SELECT * FROM tickets WHERE id = $1 AND user_id = $2", [Number(id) || 0, u.id]);
  if (!t) notFound();
  const msgs = await q<{ id: number; is_staff: boolean; message: string; created_at: string }>("SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY id", [t.id]);
  return (
    <div className="container-ep mt-8 max-w-3xl">
      <Link href="/destek" className="mb-4 inline-flex items-center gap-1.5 text-sm text-mute hover:text-bone"><ArrowLeft className="h-4 w-4" /> Destek merkezi</Link>
      <div className="panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-5">
          <h1 className="flex-1 font-display text-lg font-bold">#{t.id} {t.subject}</h1>
          {t.order_id && <Link href={`/hesabim/siparisler/${t.order_id}`} className="chip hover:text-ember">Sipariş #{t.order_id}</Link>}
          <StatusBadge status={t.status} />
        </div>
        <div className="grid gap-4 p-5">
          {msgs.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.is_staff ? "" : "flex-row-reverse"}`}>
              {m.is_staff ? (
                <LogoMark id={`m${m.id}`} className="h-9 w-9 shrink-0" />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-smoke font-display text-sm font-bold">{u.username[0].toUpperCase()}</span>
              )}
              <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${m.is_staff ? "rounded-tl-sm border border-ember/30 bg-ember/10" : "rounded-tr-sm bg-smoke"}`}>
                <div className="mb-1 text-xs font-semibold text-mute">{m.is_staff ? "EpicPin destek" : "Sen"} · {dateTimeTR(m.created_at)}</div>
                <p className="whitespace-pre-line leading-6">{m.message}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-line p-5">
          {t.status === "closed" ? (
            <p className="text-sm text-mute">Bu talep kapatıldı. Yeni bir sorun için <Link href="/destek" className="font-semibold text-ember">yeni talep aç</Link>.</p>
          ) : (
            <>
              <ReplyForm ticketId={t.id} />
              <form action={closeTicketAction} className="mt-3">
                <input type="hidden" name="ticket_id" value={t.id} />
                <Submit className="text-xs font-semibold text-mute hover:text-plasma">Sorunum çözüldü, talebi kapat</Submit>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
