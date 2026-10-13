import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import { q } from "@/lib/db";
import { dateTR, tl } from "@/lib/utils";
import { deleteCoupon, saveCoupon } from "@/app/actions/admin";
import { AdminTitle, Card, Field, Toggle } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";
import { ConfirmSubmit } from "@/components/admin/Confirm";
import { CopyButton } from "@/components/CopyButton";

export default async function Page({ searchParams }: { searchParams: Promise<{ duzenle?: string }> }) {
  const { duzenle } = await searchParams;
  const rows = await q<any>(
    `SELECT c.*, (SELECT COALESCE(SUM(discount),0) FROM orders o WHERE upper(o.coupon_code) = upper(c.code)) AS total_discount FROM coupons c ORDER BY c.id DESC`,
  );
  const c = duzenle ? rows.find((x) => x.id === Number(duzenle)) : undefined;
  const now = new Date();
  return (
    <>
      <AdminTitle title="Kuponlar" sub="Müşterilerin sepette kullanacağı indirim kodları.">
        {c && <Link href="/admin/kuponlar" className="btn-ember"><Plus className="h-4 w-4" /> Yeni kupon</Link>}
      </AdminTitle>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_400px]">
        <div className="panel divide-y divide-line">
          {rows.map((x) => {
            const expired = x.expires_at && new Date(x.expires_at) < now;
            const full = x.max_uses != null && x.used_count >= x.max_uses;
            return (
              <div key={x.id} className={`flex flex-wrap items-center gap-3 p-4 ${!x.active || expired || full ? "opacity-60" : ""}`}>
                <code className="rounded-lg border border-dashed border-ember/50 bg-ember/10 px-3 py-1.5 font-display text-sm font-bold tracking-wider text-blaze">{x.code}</code>
                <CopyButton text={x.code} label="" />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-semibold">{x.kind === "percent" ? `%${Number(x.value)} indirim` : `${tl(x.value)} indirim`}{Number(x.min_total) > 0 && <span className="font-normal text-mute">, en az {tl(x.min_total)}</span>}</div>
                  <div className="text-xs text-mute">
                    {x.used_count}{x.max_uses != null ? ` / ${x.max_uses}` : ""} kullanım, toplam {tl(x.total_discount)} indirim
                    {x.expires_at && `, son gün ${dateTR(x.expires_at)}`}
                    {expired && <span className="text-plasma"> (süresi doldu)</span>}
                    {full && <span className="text-plasma"> (limit doldu)</span>}
                  </div>
                </div>
                <Link href={`/admin/kuponlar?duzenle=${x.id}`} className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-ember hover:text-ember"><Pencil className="h-3.5 w-3.5" /></Link>
                <form action={deleteCoupon}>
                  <input type="hidden" name="id" value={x.id} />
                  <ConfirmSubmit message={`${x.code} silinsin mi?`} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mute hover:border-plasma hover:text-plasma"><Trash2 className="h-3.5 w-3.5" /></ConfirmSubmit>
                </form>
              </div>
            );
          })}
          {!rows.length && <p className="p-8 text-center text-sm text-mute">Kupon yok. Sağdaki formdan ilk kuponunu oluştur.</p>}
        </div>
        <Card title={c ? `Düzenle: ${c.code}` : "Yeni kupon"} className="lg:sticky lg:top-6">
          <AForm action={saveCoupon} key={c?.id ?? "new"} submit={c ? "Kaydet" : "Kupon oluştur"}>
            {c && <input type="hidden" name="id" value={c.id} />}
            <Field label="Kod" hint="Büyük harfe çevrilir. Örn. YAZ25"><input name="code" className="input font-display font-bold uppercase tracking-wider" defaultValue={c?.code} required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tür">
                <select name="kind" className="input" defaultValue={c?.kind ?? "percent"}>
                  <option value="percent">Yüzde (%)</option>
                  <option value="fixed">Sabit tutar (₺)</option>
                </select>
              </Field>
              <Field label="Değer"><input name="value" inputMode="decimal" className="input" defaultValue={c?.value} required placeholder="10" /></Field>
              <Field label="En az sepet ₺"><input name="min_total" inputMode="decimal" className="input" defaultValue={c?.min_total ?? 0} /></Field>
              <Field label="Kullanım limiti" hint="Boş: sınırsız"><input name="max_uses" type="number" min={1} className="input" defaultValue={c?.max_uses ?? ""} /></Field>
            </div>
            <Field label="Son kullanma tarihi" hint="Boş: süresiz"><input name="expires_at" type="date" className="input" defaultValue={c?.expires_at ? new Date(c.expires_at).toISOString().slice(0, 10) : ""} /></Field>
            <Toggle name="per_user_once" label="Her üye bir kez kullanabilir" defaultChecked={c ? c.per_user_once : true} />
            <Toggle name="active" label="Aktif" defaultChecked={c ? c.active : true} />
          </AForm>
        </Card>
      </div>
    </>
  );
}
