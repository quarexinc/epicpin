"use client";
import { useActionState } from "react";
import { createTicketAction, replyTicketAction } from "@/app/actions/user";
import { Notice, Submit } from "../FormBits";

export const TOPICS: [string, string][] = [
  ["siparis", "Sipariş / teslimat"],
  ["odeme", "Ödeme / bakiye"],
  ["iade", "İade"],
  ["hesap", "Hesap"],
  ["genel", "Diğer"],
];

export function NewTicketForm({ orders, defaultOrder }: { orders: { id: number; label: string }[]; defaultOrder?: number }) {
  const [state, action] = useActionState(createTicketAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="topic">Konu başlığı</label>
          <select id="topic" name="topic" className="input h-11" defaultValue={defaultOrder ? "siparis" : "genel"}>
            {TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="order_id">İlgili sipariş</label>
          <select id="order_id" name="order_id" className="input h-11" defaultValue={defaultOrder ?? ""}>
            <option value="">Sipariş seçme</option>
            {orders.map((o) => <option key={o.id} value={o.id}>#{o.id} {o.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="subject">Konu</label>
        <input id="subject" name="subject" className="input h-11" placeholder="Kısaca sorunun ne?" required maxLength={150} />
      </div>
      <div>
        <label className="label" htmlFor="message">Mesajın</label>
        <textarea id="message" name="message" rows={5} className="input" placeholder="Ayrıntıları yaz. Manuel teslimatlı siparişlerde hesap bilgini (ör. Riot ID) burada iletebilirsin." required />
      </div>
      <Notice state={state} />
      <Submit className="btn-ember w-fit">Talebi gönder</Submit>
    </form>
  );
}

export function ReplyForm({ ticketId }: { ticketId: number }) {
  const [state, action] = useActionState(replyTicketAction, undefined);
  return (
    <form action={action} className="grid gap-3" key={state?.ok ? Date.now() : "f"}>
      <input type="hidden" name="ticket_id" value={ticketId} />
      <textarea name="message" rows={3} className="input" placeholder="Yanıtını yaz…" required />
      <Notice state={state?.error ? state : undefined} />
      <Submit className="btn-ember w-fit">Gönder</Submit>
    </form>
  );
}
