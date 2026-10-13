import Link from "next/link";
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import { q } from "@/lib/db";
import type { Post } from "@/lib/data";
import { dateTR, img } from "@/lib/utils";
import { deletePost, savePost } from "@/app/actions/admin";
import { AdminTitle, Card, Field, Toggle } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";
import { ImageField } from "@/components/admin/ImageField";
import { ConfirmSubmit } from "@/components/admin/Confirm";

export default async function Page({ searchParams }: { searchParams: Promise<{ duzenle?: string; yeni?: string }> }) {
  const { duzenle, yeni } = await searchParams;
  const rows = await q<Post>("SELECT * FROM blog_posts ORDER BY created_at DESC, id DESC");
  const p = duzenle ? rows.find((x) => x.id === Number(duzenle)) : undefined;

  if (p || yeni)
    return (
      <>
        <Link href="/admin/blog" className="mb-3 inline-flex items-center gap-1.5 text-sm text-mute hover:text-bone"><ArrowLeft className="h-4 w-4" /> Blog</Link>
        <AdminTitle title={p ? "Yazıyı düzenle" : "Yeni yazı"} />
        <AForm action={savePost} submit={p ? "Kaydet" : "Yayınla"}>
          {p && <input type="hidden" name="id" value={p.id} />}
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <Card>
              <div className="grid gap-4">
                <Field label="Başlık"><input name="title" className="input text-base font-semibold" defaultValue={p?.title} required /></Field>
                <Field label="Kısa özet"><textarea name="excerpt" rows={2} className="input" defaultValue={p?.excerpt} /></Field>
                <Field label="İçerik" hint="Paragrafları boş satırla ayır."><textarea name="content" rows={16} className="input leading-6" defaultValue={p?.content} /></Field>
              </div>
            </Card>
            <div className="grid content-start gap-5">
              <Card><ImageField name="cover" label="Kapak görseli" current={img(p?.cover_image_id)} /></Card>
              <Card>
                <div className="grid gap-4">
                  <Field label="Adres (slug)"><input name="slug" className="input" defaultValue={p?.slug} placeholder="otomatik" /></Field>
                  <Toggle name="published" label="Yayında" defaultChecked={p ? p.published : true} />
                </div>
              </Card>
            </div>
          </div>
        </AForm>
      </>
    );

  return (
    <>
      <AdminTitle title="Blog" sub={`${rows.length} yazı`}>
        <Link href="/admin/blog?yeni=1" className="btn-ember"><Plus className="h-4 w-4" /> Yeni yazı</Link>
      </AdminTitle>
      <div className="panel divide-y divide-line">
        {rows.map((x) => (
          <div key={x.id} className={`flex items-center gap-4 p-4 ${x.published ? "" : "opacity-50"}`}>
            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-ember/30 to-plasma/20">
              {x.cover_image_id && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img(x.cover_image_id)!} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{x.title}</div>
              <div className="text-xs text-mute">{dateTR(x.created_at)} {x.published ? "" : "· Taslak"}</div>
            </div>
            <Link href={`/blog/${x.slug}`} target="_blank" className="hidden text-xs text-mute hover:text-ember sm:block">Görüntüle</Link>
            <Link href={`/admin/blog?duzenle=${x.id}`} className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-ember hover:text-ember"><Pencil className="h-3.5 w-3.5" /></Link>
            <form action={deletePost}>
              <input type="hidden" name="id" value={x.id} />
              <ConfirmSubmit message="Yazı silinsin mi?" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mute hover:border-plasma hover:text-plasma"><Trash2 className="h-3.5 w-3.5" /></ConfirmSubmit>
            </form>
          </div>
        ))}
        {!rows.length && <p className="p-8 text-center text-sm text-mute">Henüz yazı yok.</p>}
      </div>
    </>
  );
}
