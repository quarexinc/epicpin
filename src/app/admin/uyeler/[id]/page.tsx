import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { one, q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { adjustBalance, updateUser } from "@/app/actions/admin";
import { AdminTitle, Card, Field, Toggle } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id) || 0;
  const u = await one<any>("SELECT * FROM users WHERE id = $1", [id]);
  if (!u) notFound();
  const [orders, logs] = await Promise.all([
    q<any>("SELECT o.id, o.total, o.created_at, string_agg(oi.title, ', ') AS items FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.id DESC LIMIT 15", [id]),
    q<any>("SELECT * FROM balance_logs WHERE user_id = $1 ORDER BY id DESC LIMIT 15", [id]),
  ]);
  return (
    <>
      <Link href="/admin/uyeler" className="mb-3 inline-flex items-center gap-1.5 text-sm text-mute hover:text-bone"><ArrowLeft className="h-4 w-4" /> Üyeler</Link>
      <AdminTitle title={u.username} sub={`${u.email} · üye #${u.id} · ${dateTimeTR(u.created_at)}`} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Hesap">
          <AForm action={updateUser}>
            <input type="hidden" name="id" value={u.id} />
            <Field label="E-posta"><input name="email" type="email" className="input" defaultValue={u.email} required /></Field>
            <Field label="Yetki">
              <select name="role" className="input" defaultValue={u.role}>
                <option value="user">Üye</option>
                <option value="admin">Yönetici (panel erişimi)</option>
              </select>
            </Field>
            <Field label="Yeni şifre" hint="Değiştirmek istemiyorsan boş bırak."><input name="password" type="text" className="input" minLength={6} /></Field>
            <Toggle name="banned" label="Hesabı askıya al" defaultChecked={u.banned} hint="Üye giriş yapamaz." />
          </AForm>
        </Card>
        <Card title={`Bakiye: ${tl(u.balance)}`}>
          <AForm action={adjustBalance} submit="Bakiyeyi güncelle">
            <input type="hidden" name="id" value={u.id} />
            <Field label="Tutar (₺)" hint="Eklemek için 100, düşmek için -100 yaz."><input name="amount" inputMode="decimal" className="input font-display font-bold" required /></Field>
            <Field label="Açıklama" hint="Üyenin bakiye hareketlerinde görünür."><input name="note" className="input" placeholder="Kampanya hediyesi" /></Field>
          </AForm>
          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-2 text-xs font-semibold text-mute">Son hareketler</div>
            <ul className="grid gap-1.5 text-sm">
              {logs.map((l) => (
                <li key={l.id} className="flex gap-2">
                  <span className="flex-1 truncate">{l.description}</span>
                  <span className={l.amount >= 0 ? "text-mint" : ""}>{l.amount >= 0 ? "+" : ""}{tl(l.amount)}</span>
                </li>
              ))}
              {!logs.length && <li className="text-mute">Hareket yok.</li>}
            </ul>
          </div>
        </Card>
        <Card title="Siparişler" className="lg:col-span-2">
          {orders.length ? (
            <ul className="divide-y divide-line text-sm">
              {orders.map((o) => (
                <li key={o.id} className="flex gap-4 py-2.5">
                  <span className="font-display font-bold text-mute">#{o.id}</span>
                  <span className="flex-1 truncate">{o.items}</span>
                  <span className="text-mute">{dateTimeTR(o.created_at)}</span>
                  <span className="font-bold">{tl(o.total)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mute">Sipariş yok.</p>
          )}
        </Card>
      </div>
    </>
  );
}
