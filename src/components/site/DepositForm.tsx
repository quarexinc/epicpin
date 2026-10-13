"use client";
import { useActionState, useState } from "react";
import { Landmark, Smartphone, Bitcoin, CreditCard, Wallet } from "lucide-react";
import { createDepositAction } from "@/app/actions/user";
import { tl } from "@/lib/utils";
import { Notice, Submit } from "../FormBits";
import { CopyButton } from "../CopyButton";

type M = { id: number; name: string; kind: string; account_name: string; account_no: string; instructions: string; commission: number; min_amount: number };
const KIND_ICON: Record<string, any> = { bank: Landmark, papara: Smartphone, crypto: Bitcoin, card: CreditCard, other: Wallet };

export function DepositForm({ methods, initialAmount, username }: { methods: M[]; initialAmount?: number; username: string }) {
  const [sel, setSel] = useState(methods[0]?.id);
  const [amount, setAmount] = useState(initialAmount && initialAmount > 0 ? String(initialAmount) : "");
  const [state, action] = useActionState(createDepositAction, undefined);
  const m = methods.find((x) => x.id === sel);
  const fee = m && Number(amount) ? (Number(amount) * Number(m.commission)) / 100 : 0;

  if (!methods.length) return <div className="panel p-10 text-center text-sm text-mute">Şu an aktif ödeme yöntemi yok. Lütfen daha sonra tekrar dene.</div>;

  return (
    <form action={action} className="panel grid gap-6 p-6 sm:p-8">
      <fieldset>
        <legend className="mb-3 font-display font-bold">Ödeme yöntemi</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {methods.map((x) => {
            const I = KIND_ICON[x.kind] ?? Wallet;
            const on = x.id === sel;
            return (
              <label key={x.id} className={`cursor-pointer rounded-2xl border p-4 transition ${on ? "border-ember bg-ember/10 ring-2 ring-ember/25" : "border-line bg-coal hover:border-mute"}`}>
                <input type="radio" name="method_id" value={x.id} checked={on} onChange={() => setSel(x.id)} className="sr-only" />
                <I className={`h-6 w-6 ${on ? "text-ember" : "text-mute"}`} />
                <div className="mt-3 font-bold">{x.name}</div>
                <div className="text-xs text-mute">{Number(x.commission) > 0 ? `%${x.commission} komisyon` : "Komisyonsuz"}, en az {tl(x.min_amount)}</div>
              </label>
            );
          })}
        </div>
      </fieldset>

      {m && (
        <div className="rounded-2xl border border-dashed border-ember/40 bg-ember/5 p-5">
          <div className="grid gap-3 text-sm">
            {m.account_name && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-mute">Alıcı</span>
                <span className="font-semibold">{m.account_name}</span>
              </div>
            )}
            {m.account_no && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-mute">{m.kind === "bank" ? "IBAN" : m.kind === "crypto" ? "Cüzdan adresi" : "Hesap no"}</span>
                <span className="flex items-center gap-2">
                  <code className="break-all font-display text-[13px] font-bold">{m.account_no}</code>
                  <CopyButton text={m.account_no.replace(/\s/g, "")} />
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-mute">Açıklama</span>
              <span className="flex items-center gap-2"><code className="font-bold">{username}</code><CopyButton text={username} /></span>
            </div>
          </div>
          {m.instructions && <p className="mt-4 border-t border-ember/20 pt-4 text-sm text-bone/80">{m.instructions}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="amount">Yüklenecek tutar (₺)</label>
          <input id="amount" name="amount" inputMode="decimal" className="input h-12 font-display text-lg font-bold" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0" required />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[50, 100, 250, 500, 1000].map((v) => (
              <button type="button" key={v} onClick={() => setAmount(String(v))} className="rounded-lg border border-line bg-coal px-2.5 py-1 text-xs font-semibold hover:border-ember">
                {v} ₺
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="sender_name">Gönderen ad soyad</label>
          <input id="sender_name" name="sender_name" className="input h-12" placeholder="Ödemeyi yapan kişinin adı" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="note">Not (isteğe bağlı)</label>
        <input id="note" name="note" className="input" placeholder="Dekont numarası, işlem saati vb." />
      </div>
      {fee > 0 && <p className="text-sm text-mute">Göndermen gereken tutar: <b className="text-bone">{tl(Number(amount) + fee)}</b> (komisyon dahil)</p>}
      <Notice state={state} />
      <Submit className="btn-ember h-12 text-base">Ödemeyi yaptım, bildir</Submit>
    </form>
  );
}
