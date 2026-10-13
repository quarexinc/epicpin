import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import { q } from "@/lib/db";
import type { Faq } from "@/lib/data";
import { deleteFaq, saveFaq } from "@/app/actions/admin";
import { AdminTitle, Card, Field, Toggle } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";
import { ConfirmSubmit } from "@/components/admin/Confirm";

export default async function Page({ searchParams }: { searchParams: Promise<{ duzenle?: string }> }) {
  const { duzenle } = await searchParams;
  const rows = await q<Faq>("SELECT * FROM faqs ORDER BY sort, id");
  const f = duzenle ? rows.find((x) => x.id === Number(duzenle)) : undefined;
  return (
    <>
      <AdminTitle title="Sık sorulanlar" sub="Destek merkezi sayfasında görünen sorular ve cevaplar.">
        {f && <Link href="/admin/sss" className="btn-ember"><Plus className="h-4 w-4" /> Yeni soru</Link>}
      </AdminTitle>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_420px]">
        <div className="panel divide-y divide-line">
          {rows.map((x) => (
            <div key={x.id} className={`flex items-start gap-3 p-4 ${x.active ? "" : "opacity-50"}`}>
              <span className="mt-0.5 font-display text-xs font-bold text-mute">{x.sort}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{x.question}</div>
                <p className="mt-1 line-clamp-2 text-sm text-mute">{x.answer}</p>
              </div>
              <Link href={`/admin/sss?duzenle=${x.id}`} className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-ember hover:text-ember"><Pencil className="h-3.5 w-3.5" /></Link>
              <form action={deleteFaq}>
                <input type="hidden" name="id" value={x.id} />
                <ConfirmSubmit message="Soru silinsin mi?" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mute hover:border-plasma hover:text-plasma"><Trash2 className="h-3.5 w-3.5" /></ConfirmSubmit>
              </form>
            </div>
          ))}
          {!rows.length && <p className="p-8 text-center text-sm text-mute">Soru yok.</p>}
        </div>
        <Card title={f ? "Soruyu düzenle" : "Yeni soru"} className="lg:sticky lg:top-6">
          <AForm action={saveFaq} key={f?.id ?? "new"} submit={f ? "Kaydet" : "Soru ekle"}>
            {f && <input type="hidden" name="id" value={f.id} />}
            <Field label="Soru"><input name="question" className="input" defaultValue={f?.question} required /></Field>
            <Field label="Cevap"><textarea name="answer" rows={5} className="input" defaultValue={f?.answer} required /></Field>
            <Field label="Sıra"><input name="sort" type="number" className="input" defaultValue={f?.sort ?? rows.length} /></Field>
            <Toggle name="active" label="Yayında" defaultChecked={f ? f.active : true} />
          </AForm>
        </Card>
      </div>
    </>
  );
}
