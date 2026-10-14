import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import { q } from "@/lib/db";
import type { Announcement } from "@/lib/data";
import { dateTR } from "@/lib/utils";
import { deleteAnnouncement, saveAnnouncement } from "@/app/actions/admin";
import { AdminTitle, Card, Field, Toggle } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";
import { ConfirmSubmit } from "@/components/admin/Confirm";
import { LinkInput } from "@/components/admin/LinkInput";

const KINDS: Record<string, string> = { info: "Bilgi", promo: "Kampanya", warning: "Uyarı" };

export default async function Page({ searchParams }: { searchParams: Promise<{ duzenle?: string }> }) {
  const { duzenle } = await searchParams;
  const rows = await q<Announcement>("SELECT * FROM announcements ORDER BY created_at DESC, id DESC");
  const a = duzenle ? rows.find((x) => x.id === Number(duzenle)) : undefined;
  return (
    <>
      <AdminTitle title="Duyurular" sub="Üst şeritte kayan yazı olarak ve Duyurular sayfasında görünür.">
        {a && <Link href="/admin/duyurular" className="btn-ember"><Plus className="h-4 w-4" /> Yeni duyuru</Link>}
      </AdminTitle>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="panel divide-y divide-line">
          {rows.map((x) => (
            <div key={x.id} className={`flex items-start gap-3 p-4 ${x.active ? "" : "opacity-50"}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{x.title}</span>
                  <span className="chip py-0.5">{KINDS[x.kind] ?? x.kind}</span>
                  {x.in_ticker && <span className="chip py-0.5 text-ember">Kayan şeritte</span>}
                </div>
                {x.content && <p className="mt-1 text-sm text-mute">{x.content}</p>}
                <div className="mt-1 text-xs text-mute">{dateTR(x.created_at)}</div>
              </div>
              <Link href={`/admin/duyurular?duzenle=${x.id}`} className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-ember hover:text-ember"><Pencil className="h-3.5 w-3.5" /></Link>
              <form action={deleteAnnouncement}>
                <input type="hidden" name="id" value={x.id} />
                <ConfirmSubmit message="Duyuru silinsin mi?" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mute hover:border-plasma hover:text-plasma"><Trash2 className="h-3.5 w-3.5" /></ConfirmSubmit>
              </form>
            </div>
          ))}
          {!rows.length && <p className="p-8 text-center text-sm text-mute">Duyuru yok.</p>}
        </div>
        <Card title={a ? "Duyuru düzenle" : "Duyuru geç"} className="lg:sticky lg:top-6">
          <AForm action={saveAnnouncement} key={a?.id ?? "new"} submit={a ? "Kaydet" : "Duyuruyu yayınla"}>
            {a && <input type="hidden" name="id" value={a.id} />}
            <Field label="Başlık"><input name="title" className="input" defaultValue={a?.title} required /></Field>
            <Field label="İçerik"><textarea name="content" rows={3} className="input" defaultValue={a?.content} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tür">
                <select name="kind" className="input" defaultValue={a?.kind ?? "info"}>
                  {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Tıklayınca gideceği sayfa"><LinkInput name="link" defaultValue={a?.link} /></Field>
            </div>
            <Toggle name="in_ticker" label="Üst şeritte kayan yazı olarak göster" defaultChecked={a ? a.in_ticker : true} />
            <Toggle name="active" label="Yayında" defaultChecked={a ? a.active : true} />
          </AForm>
        </Card>
      </div>
    </>
  );
}
