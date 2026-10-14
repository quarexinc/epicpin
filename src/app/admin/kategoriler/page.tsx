import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import { getCategories } from "@/lib/data";
import { img } from "@/lib/utils";
import { deleteCategory, saveCategory } from "@/app/actions/admin";
import { AdminTitle, Card, Field, Toggle } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";
import { ImageField } from "@/components/admin/ImageField";
import { ConfirmSubmit } from "@/components/admin/Confirm";
import { Icon, ICONS } from "@/components/Icon";

export default async function Page({ searchParams }: { searchParams: Promise<{ duzenle?: string }> }) {
  const { duzenle } = await searchParams;
  const cats = await getCategories(true);
  const c = duzenle ? cats.find((x) => x.id === Number(duzenle)) : undefined;
  return (
    <>
      <AdminTitle title="Kategoriler" sub="Oyunlar ve platformlar. Sıra numarası küçük olan önce görünür.">
        {c && <Link href="/admin/kategoriler" className="btn-ember"><Plus className="h-4 w-4" /> Yeni kategori</Link>}
      </AdminTitle>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="panel divide-y divide-line">
          {cats.map((x) => (
            <div key={x.id} className={`flex items-center gap-3 p-3 pl-4 ${x.active ? "" : "opacity-50"} ${c?.id === x.id ? "bg-ember/5" : ""}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: `${x.color}22`, color: x.color }}>
                {x.image_id ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img(x.image_id)!} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Icon name={x.icon} className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{x.name}</div>
                <div className="text-xs text-mute">/{x.slug} · {x.listing_count} ilan · sıra {x.sort}</div>
              </div>
              <Link href={`/admin/kategoriler?duzenle=${x.id}`} className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-ember hover:text-ember" title="Düzenle"><Pencil className="h-3.5 w-3.5" /></Link>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={x.id} />
                <ConfirmSubmit message={`${x.name} silinsin mi?`} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mute hover:border-plasma hover:text-plasma"><Trash2 className="h-3.5 w-3.5" /></ConfirmSubmit>
              </form>
            </div>
          ))}
        </div>
        <Card title={c ? `Düzenle: ${c.name}` : "Yeni kategori"} className="lg:sticky lg:top-6">
          <AForm action={saveCategory} key={c?.id ?? "new"} submit={c ? "Kaydet" : "Kategori ekle"}>
            {c && <input type="hidden" name="id" value={c.id} />}
            <Field label="Ad"><input name="name" className="input" defaultValue={c?.name} required /></Field>
            <Field label="Açıklama"><input name="description" className="input" defaultValue={c?.description} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Simge">
                <select name="icon" className="input" defaultValue={c?.icon ?? "Gamepad2"}>
                  {Object.keys(ICONS).map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
              <Field label="Renk"><input name="color" type="color" className="input h-[42px] p-1" defaultValue={c?.color ?? "#FF6A13"} /></Field>
              <Field label="Sıra"><input name="sort" type="number" className="input" defaultValue={c?.sort ?? cats.length} /></Field>
              <Field label="Adres (slug)"><input name="slug" className="input" defaultValue={c?.slug} placeholder="otomatik" /></Field>
            </div>
            <ImageField name="image" label="Kapak görseli (isteğe bağlı)" current={img(c?.image_id)} max={1200} />
            <Toggle name="active" label="Aktif" defaultChecked={c ? c.active : true} />
            <Toggle name="show_in_bar" label="Ana sayfa hızlı menüde göster" defaultChecked={c ? c.show_in_bar : true} />
          </AForm>
        </Card>
      </div>
    </>
  );
}
