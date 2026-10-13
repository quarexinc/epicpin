import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import { q } from "@/lib/db";
import type { Banner } from "@/lib/data";
import { img } from "@/lib/utils";
import { deleteBanner, saveBanner } from "@/app/actions/admin";
import { AdminTitle, Card, Field, Toggle } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";
import { ImageField } from "@/components/admin/ImageField";
import { ConfirmSubmit } from "@/components/admin/Confirm";
import { LinkInput } from "@/components/admin/LinkInput";
import { BannerArt, THEMES } from "@/components/site/BannerArt";

export default async function Page({ searchParams }: { searchParams: Promise<{ duzenle?: string }> }) {
  const { duzenle } = await searchParams;
  const rows = await q<Banner>("SELECT * FROM banners ORDER BY sort, id");
  const b = duzenle ? rows.find((x) => x.id === Number(duzenle)) : undefined;
  return (
    <>
      <AdminTitle title="Bannerlar" sub="Ana sayfadaki kayan kampanya alanı. Bannerin tamamı tıklanabilir ve seçtiğin sayfaya gider. Görsel yüklemezsen renk temasıyla otomatik sahne çizilir.">
        {b && <Link href="/admin/bannerlar" className="btn-ember"><Plus className="h-4 w-4" /> Yeni banner</Link>}
      </AdminTitle>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-3">
          {rows.map((x) => {
            const t = THEMES[x.theme] ?? THEMES.ember;
            return (
              <div key={x.id} className={`panel flex items-center gap-4 overflow-hidden p-3 ${x.active ? "" : "opacity-50"} ${b?.id === x.id ? "border-ember" : ""}`}>
                <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-xl" style={{ background: t.bg }}>
                  {x.image_id ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img(x.image_id)!} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <BannerArt theme={x.theme} seed={x.id + 1000} className="absolute inset-0 h-full w-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{x.title}</div>
                  <div className="truncate text-xs text-mute">{x.subtitle}</div>
                  <div className="mt-1 text-xs text-mute">Sıra {x.sort} · {x.cta_link}</div>
                </div>
                <Link href={`/admin/bannerlar?duzenle=${x.id}`} className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-ember hover:text-ember"><Pencil className="h-3.5 w-3.5" /></Link>
                <form action={deleteBanner}>
                  <input type="hidden" name="id" value={x.id} />
                  <ConfirmSubmit message="Banner silinsin mi?" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mute hover:border-plasma hover:text-plasma"><Trash2 className="h-3.5 w-3.5" /></ConfirmSubmit>
                </form>
              </div>
            );
          })}
          {!rows.length && <p className="panel p-8 text-center text-sm text-mute">Banner yok. Sağdaki formdan ekle.</p>}
        </div>
        <Card title={b ? "Banner düzenle" : "Yeni banner"} className="lg:sticky lg:top-6">
          <AForm action={saveBanner} key={b?.id ?? "new"} submit={b ? "Kaydet" : "Banner ekle"}>
            {b && <input type="hidden" name="id" value={b.id} />}
            <Field label="Başlık"><input name="title" className="input" defaultValue={b?.title} required /></Field>
            <Field label="Alt metin"><input name="subtitle" className="input" defaultValue={b?.subtitle} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Etiket"><input name="label" className="input" defaultValue={b?.label} placeholder="Haftanın fırsatı" /></Field>
              <Field label="Renk teması">
                <select name="theme" className="input" defaultValue={b?.theme ?? "ember"}>
                  {Object.entries(THEMES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </Field>
              <Field label="Buton yazısı"><input name="cta_text" className="input" defaultValue={b?.cta_text ?? "Hemen al"} /></Field>
              <Field label="Tıklayınca gideceği sayfa" className="col-span-2"><LinkInput name="cta_link" defaultValue={b?.cta_link ?? "/ilanlar"} /></Field>
              <Field label="Sıra"><input name="sort" type="number" className="input" defaultValue={b?.sort ?? rows.length} /></Field>
            </div>
            <ImageField name="image" label="Arka plan görseli (isteğe bağlı)" current={img(b?.image_id)} hint="Önerilen: 1600×700 px. Metin sol tarafta durur." />
            <Toggle name="active" label="Yayında" defaultChecked={b ? b.active : true} />
          </AForm>
        </Card>
      </div>
    </>
  );
}
