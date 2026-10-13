import { getSettings } from "@/lib/data";
import { img } from "@/lib/utils";
import { saveSettings } from "@/app/actions/admin";
import { AdminTitle, Card, Field, Toggle } from "@/components/admin/Fields";
import { LinkInput } from "@/components/admin/LinkInput";
import { AForm } from "@/components/admin/AForm";
import { ImageField } from "@/components/admin/ImageField";
import { Logo } from "@/components/Logo";

export default async function Page() {
  const s = await getSettings();
  return (
    <>
      <AdminTitle title="Site ayarları" sub="Logo, site adı, üst kampanya şeridi ve sosyal medya bağlantıları." />
      <AForm action={saveSettings} submit="Ayarları kaydet">
        <input type="hidden" name="_flags" value="1" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Site durumu" className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid content-start gap-3">
                <Toggle name="maintenance_on" label="Bakım modu" defaultChecked={s.maintenance_on === "on"} hint="Açıkken ziyaretçiler bakım ekranı görür, yöneticiler siteyi normal görür." />
                <Field label="Bakım mesajı"><textarea name="maintenance_text" rows={2} className="input" defaultValue={s.maintenance_text} /></Field>
              </div>
              <div className="grid content-start gap-3">
                <Toggle name="live_feed_on" label="Canlı satış şeridi" defaultChecked={s.live_feed_on !== ""} hint="Ana sayfada son gerçek siparişleri (kullanıcı adları gizlenmiş) gösterir." />
                <Field label="WhatsApp destek numarası" hint="Örn. 905551112233. Boşsa gösterilmez."><input name="whatsapp" className="input" defaultValue={s.whatsapp} /></Field>
              </div>
              <div className="grid content-start gap-3 rounded-xl border border-line bg-coal p-4">
                <Toggle name="popup_on" label="Açılış penceresi (popup)" defaultChecked={s.popup_on === "on"} hint="Kaydettiğinde her ziyaretçiye bir kez gösterilir." />
                <Field label="Başlık"><input name="popup_title" className="input" defaultValue={s.popup_title} /></Field>
                <Field label="Metin"><textarea name="popup_text" rows={2} className="input" defaultValue={s.popup_text} /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Buton yazısı"><input name="popup_button" className="input" defaultValue={s.popup_button} /></Field>
                  <Field label="Buton linki"><LinkInput name="popup_link" defaultValue={s.popup_link} /></Field>
                </div>
                <ImageField name="popup_image" label="Görsel (isteğe bağlı)" current={img(s.popup_image_id)} aspect="aspect-[2/1]" max={1000} />
              </div>
            </div>
          </Card>
          <Card title="Marka">
            <div className="grid gap-4">
              <Field label="Site adı"><input name="site_name" className="input" defaultValue={s.site_name} /></Field>
              <Field label="Slogan / açıklama" hint="Arama motorlarında ve paylaşımlarda görünür."><textarea name="tagline" rows={2} className="input" defaultValue={s.tagline} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageField name="logo" label="Logo" current={img(s.logo_image_id)} aspect="aspect-[3/1]" max={800} hint="Boşsa EpicPin logosu kullanılır." />
                <ImageField name="favicon" label="Favicon" current={img(s.favicon_image_id)} aspect="aspect-[3/1]" max={256} hint="Kare PNG, 256×256." />
              </div>
              <div className="rounded-xl border border-line bg-void p-4">
                <div className="mb-2 text-xs text-mute">Varsayılan logo</div>
                <Logo />
              </div>
            </div>
          </Card>
          <Card title="Alt bilgi ve iletişim">
            <div className="grid gap-4">
              <Field label="Alt bilgi metni"><textarea name="footer_about" rows={3} className="input" defaultValue={s.footer_about} /></Field>
              <Field label="İletişim e-postası"><input name="contact_email" className="input" defaultValue={s.contact_email} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Instagram"><input name="instagram" className="input" defaultValue={s.instagram} /></Field>
                <Field label="Discord"><input name="discord" className="input" defaultValue={s.discord} /></Field>
                <Field label="X (Twitter)"><input name="x" className="input" defaultValue={s.x} /></Field>
                <Field label="YouTube"><input name="youtube" className="input" defaultValue={s.youtube} /></Field>
              </div>
            </div>
          </Card>
          <Card title="Üst kampanya şeridi" className="lg:col-span-2">
            <p className="mb-4 text-sm text-mute">Sitenin en üstündeki üç kutu. Link bir kategoriye gidiyorsa kutu o kategorinin rengini ve simgesini alır. Kutuyu gizlemek için başlığı boş bırak.</p>
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid gap-3 rounded-xl border border-line bg-coal p-4">
                  <div className="text-xs font-semibold text-mute">Kutu {i}</div>
                  <Field label="Başlık"><input name={`promo${i}_title`} className="input" defaultValue={s[`promo${i}_title`]} /></Field>
                  <Field label="Metin"><input name={`promo${i}_text`} className="input" defaultValue={s[`promo${i}_text`]} /></Field>
                  <Field label="Link"><LinkInput name={`promo${i}_link`} defaultValue={s[`promo${i}_link`]} /></Field>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </AForm>
    </>
  );
}
