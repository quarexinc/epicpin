import { getCategories, getListings } from "@/lib/data";

/** Link alanı: yazarken sitenin sayfaları, kategorileri ve ilanları öneri olarak çıkar. */
export async function LinkInput({ name, defaultValue, placeholder = "/kategori/valorant" }: { name: string; defaultValue?: string; placeholder?: string }) {
  const [cats, listings] = await Promise.all([getCategories(), getListings({ limit: 200 })]);
  const id = `links-${name}`;
  return (
    <>
      <input name={name} list={id} className="input" defaultValue={defaultValue} placeholder={placeholder} autoComplete="off" />
      <datalist id={id}>
        {[
          ["/", "Ana sayfa"],
          ["/ilanlar", "İlan pazarı"],
          ["/ilanlar?sirala=indirim", "Haftanın fırsatları"],
          ["/ilanlar?sirala=populer", "Çok satanlar"],
          ["/kategoriler", "Tüm kategoriler"],
          ["/bakiye-yukle", "Bakiye yükle"],
          ["/blog", "Blog"],
          ["/duyurular", "Duyurular"],
          ["/destek", "Destek"],
          ["/kayit", "Kayıt ol"],
        ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        {cats.map((c) => <option key={c.id} value={`/kategori/${c.slug}`}>Kategori: {c.name}</option>)}
        {listings.map((l) => <option key={l.id} value={`/ilan/${l.slug}`}>İlan: {l.title}</option>)}
      </datalist>
    </>
  );
}
