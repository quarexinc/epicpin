import { saveListing } from "@/app/actions/admin";
import type { Category, Listing } from "@/lib/data";
import { img } from "@/lib/utils";
import { AForm } from "./AForm";
import { Card, Field, Toggle } from "./Fields";
import { ImageField } from "./ImageField";

export function ListingForm({ l, cats }: { l?: Listing | null; cats: Category[] }) {
  return (
    <AForm action={saveListing} submit={l ? "Değişiklikleri kaydet" : "İlanı yayınla"}>
      {l && <input type="hidden" name="id" value={l.id} />}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid content-start gap-5">
          <Card title="Ürün bilgileri">
            <div className="grid gap-4">
              <Field label="Başlık">
                <input name="title" className="input" defaultValue={l?.title} required placeholder="Örn. Valorant 1000 VP" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Kategori">
                  <select name="category_id" className="input" defaultValue={l?.category_id ?? cats[0]?.id}>
                    <option value="">Kategorisiz</option>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Adres (slug)" hint="Boş bırakırsan başlıktan oluşur.">
                  <input name="slug" className="input" defaultValue={l?.slug} placeholder="otomatik oluşur" />
                </Field>
              </div>
              <Field label="Açıklama" hint="Paragrafları boş satırla ayır.">
                <textarea name="description" rows={7} className="input" defaultValue={l?.description} />
              </Field>
            </div>
          </Card>
          <Card title="Teslimat ve stok">
            <div className="grid gap-4">
              <Field label="Teslimat türü">
                <select name="delivery_type" className="input" defaultValue={l?.delivery_type ?? "auto"}>
                  <option value="auto">Otomatik: stoktaki kod ödeme anında verilir</option>
                  <option value="manual">Manuel: siparişi sen teslim edersin</option>
                </select>
              </Field>
              <Field label="Stoğa kod ekle (otomatik teslimat)" hint={`Her satıra bir kod yaz. ${l ? `Şu an stokta ${l.delivery_type === "auto" ? l.stock : 0} kullanılmamış kod var.` : ""}`}>
                <textarea name="codes" rows={5} className="input font-mono text-xs" placeholder={"ABCD-1234-EFGH\nWXYZ-5678-QRST"} />
              </Field>
              <Field label="Manuel stok adedi" hint="Sadece manuel teslimatlı ürünlerde kullanılır.">
                <input name="manual_stock" type="number" min={0} className="input" defaultValue={l?.manual_stock ?? 0} />
              </Field>
            </div>
          </Card>
        </div>
        <div className="grid content-start gap-5">
          <Card title="Fiyat">
            <div className="grid gap-4">
              <Field label="Satış fiyatı (₺)">
                <input name="price" inputMode="decimal" className="input font-display font-bold" defaultValue={l?.price} required placeholder="379.90" />
              </Field>
              <Field label="Eski fiyat (₺)" hint="Doldurursan ürün indirimli görünür: eski fiyat üstü çizili ve indirim yüzdesi rozetiyle.">
                <input name="old_price" inputMode="decimal" className="input" defaultValue={l?.old_price ?? ""} placeholder="449.90" />
              </Field>
            </div>
          </Card>
          <Card title="Kapak fotoğrafı">
            <ImageField name="cover" label="Kapak" current={img(l?.cover_image_id)} aspect="aspect-[4/3]" max={1400} hint="Boş bırakırsan kategori renginde otomatik kapak oluşur." />
          </Card>
          <Card title="Görünürlük">
            <div className="grid gap-3">
              <Toggle name="active" label="Satışta" defaultChecked={l ? l.active : true} hint="Kapalıysa sitede görünmez." />
              <Toggle name="featured" label="Öne çıkan" defaultChecked={l?.featured} />
            </div>
          </Card>
        </div>
      </div>
    </AForm>
  );
}
