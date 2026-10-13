import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import { q } from "@/lib/db";
import { tl } from "@/lib/utils";
import { deletePaymentMethod, savePaymentMethod } from "@/app/actions/admin";
import { AdminTitle, Card, Field, Toggle } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";
import { ConfirmSubmit } from "@/components/admin/Confirm";

const KINDS: Record<string, string> = { bank: "Havale / EFT", papara: "Papara", crypto: "Kripto", card: "Kart / sanal POS", other: "Diğer" };
const ALL_KINDS: Record<string, string> = { ...KINDS, shopier: "Shopier kartla ödeme" };

export default async function Page({ searchParams }: { searchParams: Promise<{ duzenle?: string }> }) {
  const { duzenle } = await searchParams;
  const rows = await q<any>("SELECT * FROM payment_methods ORDER BY sort, id");
  const m = duzenle ? rows.find((x) => x.id === Number(duzenle) && x.kind !== "shopier") : undefined;
  return (
    <>
      <AdminTitle title="Ödeme yöntemleri" sub="Bakiye yükleme sayfasında görünen hesaplar. Kullanıcı ödeme yapıp bildirim gönderir, sen Bakiye talepleri ekranından onaylarsın.">
        {m && <Link href="/admin/odeme" className="btn-ember"><Plus className="h-4 w-4" /> Yeni yöntem</Link>}
      </AdminTitle>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_420px]">
        <div className="panel divide-y divide-line">
          {rows.map((x) => (
            <div key={x.id} className={`flex items-start gap-3 p-4 ${x.active ? "" : "opacity-50"}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{x.name}</span>
                  <span className="chip py-0.5">{ALL_KINDS[x.kind] ?? x.kind}</span>
                  {!x.active && <span className="chip py-0.5 text-plasma">Kapalı</span>}
                </div>
                <div className="mt-1 break-all font-mono text-xs text-mute">{x.account_name} {x.account_no}</div>
                <div className="mt-1 text-xs text-mute">Komisyon %{x.commission}, en az {tl(x.min_amount)}</div>
              </div>
              {x.kind === "shopier" ? (
                <Link href="/admin/shopier" className="btn-ghost px-3 py-1.5 text-xs">Shopier ayarları</Link>
              ) : (
              <Link href={`/admin/odeme?duzenle=${x.id}`} className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-ember hover:text-ember"><Pencil className="h-3.5 w-3.5" /></Link>
              )}
              {x.kind !== "shopier" && <form action={deletePaymentMethod}>
                <input type="hidden" name="id" value={x.id} />
                <ConfirmSubmit message="Ödeme yöntemi silinsin mi?" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mute hover:border-plasma hover:text-plasma"><Trash2 className="h-3.5 w-3.5" /></ConfirmSubmit>
              </form>}
            </div>
          ))}
          {!rows.length && <p className="p-8 text-center text-sm text-mute">Ödeme yöntemi yok.</p>}
        </div>
        <Card title={m ? "Yöntemi düzenle" : "Yeni ödeme yöntemi"} className="lg:sticky lg:top-6">
          <AForm action={savePaymentMethod} key={m?.id ?? "new"} submit={m ? "Kaydet" : "Yöntem ekle"}>
            {m && <input type="hidden" name="id" value={m.id} />}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Görünen ad"><input name="name" className="input" defaultValue={m?.name} required placeholder="Ziraat Bankası" /></Field>
              <Field label="Tür">
                <select name="kind" className="input" defaultValue={m?.kind ?? "bank"}>
                  {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Alıcı adı"><input name="account_name" className="input" defaultValue={m?.account_name} /></Field>
            <Field label="IBAN / hesap no / cüzdan adresi"><input name="account_no" className="input font-mono" defaultValue={m?.account_no} /></Field>
            <Field label="Kullanıcıya talimat"><textarea name="instructions" rows={3} className="input" defaultValue={m?.instructions} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Komisyon %"><input name="commission" inputMode="decimal" className="input" defaultValue={m?.commission ?? 0} /></Field>
              <Field label="En az ₺"><input name="min_amount" inputMode="decimal" className="input" defaultValue={m?.min_amount ?? 10} /></Field>
              <Field label="Sıra"><input name="sort" type="number" className="input" defaultValue={m?.sort ?? rows.length} /></Field>
            </div>
            <Toggle name="active" label="Aktif" defaultChecked={m ? m.active : true} />
          </AForm>
        </Card>
      </div>
    </>
  );
}
