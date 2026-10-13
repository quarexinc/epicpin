import Link from "next/link";
import { headers } from "next/headers";
import { CreditCard, BellRing, Mail, CircleCheck, CircleAlert, ExternalLink, Send, Check, X } from "lucide-react";
import { q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { saveShopierSettings, sendTestMail, markShopierPaid, cancelShopierPayment, osbResend, osbManualDeliver } from "@/app/actions/admin";
import { AdminTitle, Card, Field, Toggle } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";
import { ConfirmSubmit } from "@/components/admin/Confirm";
import { CopyButton } from "@/components/CopyButton";
import { StatusBadge } from "@/components/StatusBadge";
import { Submit } from "@/components/FormBits";

const PAY_STATUS: Record<string, [string, string]> = { pending: ["pending", "Bekliyor"], paid: ["approved", "Ödendi"], failed: ["rejected", "Başarısız"] };
const OSB_STATUS: Record<string, [string, string]> = {
  delivered: ["approved", "Teslim edildi"],
  partial: ["pending", "Kısmen teslim"],
  no_stock: ["rejected", "Stok yok / manuel"],
  unmatched: ["rejected", "Ürün eşleşmedi"],
  test: ["closed", "Test"],
  pending: ["pending", "İşleniyor"],
};

function Ok({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${on ? "bg-mint/15 text-mint" : "bg-plasma/15 text-plasma"}`}>
      {on ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />} {children}
    </span>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ sekme?: string }> }) {
  const { sekme = "ayarlar" } = await searchParams;
  const h = await headers();
  const base = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const callbackUrl = `${base}/api/shopier/callback`;
  const osbUrl = `${base}/api/shopier/osb`;
  const rows = await q<{ key: string; value: string }>("SELECT key, value FROM settings");
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const [m] = await q<any>("SELECT * FROM payment_methods WHERE kind = 'shopier' ORDER BY id LIMIT 1");
  const payReady = !!(s.shopier_api_key && s.shopier_api_secret);
  const osbReady = !!(s.osb_username && s.osb_key);
  const mailReady = !!(s.smtp_host && s.smtp_user && s.smtp_pass);
  const counts = (await q<{ p: number; o: number }>(`SELECT
    (SELECT COUNT(*)::int FROM shopier_payments WHERE status = 'pending' AND created_at > now() - interval '2 days') AS p,
    (SELECT COUNT(*)::int FROM osb_orders WHERE status IN ('unmatched','no_stock','partial')) AS o`))[0];

  const tabs: [string, string, number][] = [
    ["ayarlar", "Ayarlar", 0],
    ["odemeler", "Kart ödemeleri", counts.p],
    ["osb", "OSB siparişleri", counts.o],
  ];

  return (
    <>
      <AdminTitle title="Shopier ve OSB" sub="Kartla ödeme, Shopier mağaza satışlarının otomatik teslimi ve kodların e-postayla gönderimi.">
        <a href="https://www.shopier.com" target="_blank" rel="noreferrer" className="btn-ghost"><ExternalLink className="h-4 w-4" /> Shopier paneli</a>
      </AdminTitle>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(([k, l, n]) => (
          <Link key={k} href={`/admin/shopier?sekme=${k}`} className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${sekme === k ? "border-ember bg-ember text-void" : "border-line bg-ash"}`}>
            {l}
            {n > 0 && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] ${sekme === k ? "bg-void text-ember" : "bg-plasma text-white"}`}>{n}</span>}
          </Link>
        ))}
      </div>

      {sekme === "ayarlar" && (
        <div className="grid gap-5">
          <div className="flex flex-wrap gap-2">
            <Ok on={payReady && !!m?.active}>Kartla ödeme {payReady && m?.active ? "açık" : "kapalı"}</Ok>
            <Ok on={osbReady}>OSB {osbReady ? "hazır" : "ayarlanmadı"}</Ok>
            <Ok on={mailReady}>E-posta {mailReady ? "hazır" : "ayarlanmadı"}</Ok>
          </div>

          <Card title="1. Kartla ödeme (Shopier API)">
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <AForm action={saveShopierSettings} submit="Ödeme ayarlarını kaydet">
                <input type="hidden" name="section" value="payment" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="API Key (API kullanıcı)"><input name="shopier_api_key" className="input font-mono" defaultValue={s.shopier_api_key} autoComplete="off" /></Field>
                  <Field label="API Secret (API şifre)" hint={s.shopier_api_secret ? "Kayıtlı. Değiştirmek için yenisini yaz." : "Henüz girilmedi."}>
                    <input name="shopier_api_secret" type="password" className="input font-mono" placeholder={s.shopier_api_secret ? "••••••••••••" : ""} autoComplete="new-password" />
                  </Field>
                  <Field label="Website index" hint="Shopier panelinde bu sitenin kayıtlı olduğu sıra (genelde 1).">
                    <select name="shopier_website_index" className="input" defaultValue={s.shopier_website_index || "1"}>
                      {[1, 2, 3, 4, 5].map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Sitede görünen adı"><input name="card_name" className="input" defaultValue={m?.name ?? "Kredi / Banka Kartı"} /></Field>
                  <Field label="İşlem ücreti (%)" hint="Shopier komisyonunu müşteriye yansıtmak için. 0 yazarsan sen karşılarsın."><input name="card_commission" inputMode="decimal" className="input" defaultValue={m?.commission ?? 0} /></Field>
                  <Field label="En az yükleme (₺)"><input name="card_min" inputMode="decimal" className="input" defaultValue={m?.min_amount ?? 10} /></Field>
                </div>
                <Toggle name="card_active" label="Kartla ödemeyi aç" defaultChecked={!!m?.active} hint="Açıkken Bakiye yükle sayfasında ve sepette Kartla öde seçeneği çıkar." />
                {s.shopier_api_secret && (
                  <label className="flex items-center gap-2 text-xs text-mute"><input type="checkbox" name="clear_secret" className="accent-[#FF6A13]" /> Kayıtlı API Secret&apos;ı sil</label>
                )}
              </AForm>
              <div className="grid content-start gap-3 rounded-2xl border border-line bg-coal p-5 text-sm">
                <div className="font-display font-bold">Shopier panelinde yapılacaklar</div>
                <ol className="grid list-decimal gap-2 pl-4 text-bone/80">
                  <li>Shopier hesabına gir, <b>Entegrasyonlar &gt; Modül Yönetimi</b> bölümünü aç.</li>
                  <li>Kendi web siten için modül ekle; site adresi olarak <code className="text-blaze">{base}</code> yaz.</li>
                  <li><b>Geri dönüş URL</b> alanına aşağıdaki adresi yapıştır.</li>
                  <li>Orada görünen <b>API kullanıcı</b> ve <b>API şifre</b> bilgilerini soldaki alanlara gir, kartla ödemeyi aç.</li>
                </ol>
                <div className="mt-1">
                  <div className="label">Geri dönüş URL</div>
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-ember/50 bg-ember/5 p-2.5">
                    <code className="flex-1 break-all text-xs">{callbackUrl}</code>
                    <CopyButton text={callbackUrl} label="" />
                  </div>
                </div>
                <p className="text-xs text-mute">Ödeme bitince Shopier müşteriyi bu adrese gönderir; imza doğrulanır, bakiye yüklenir ya da sipariş anında oluşturulup kodlar teslim edilir.</p>
              </div>
            </div>
          </Card>

          <Card title="2. OSB: Shopier mağaza satışlarını otomatik teslim et">
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <AForm action={saveShopierSettings} submit="OSB ayarlarını kaydet">
                <input type="hidden" name="section" value="osb" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="OSB kullanıcı adı"><input name="osb_username" className="input font-mono" defaultValue={s.osb_username} autoComplete="off" /></Field>
                  <Field label="OSB anahtarı" hint={s.osb_key ? "Kayıtlı. Değiştirmek için yenisini yaz." : "Henüz girilmedi."}>
                    <input name="osb_key" type="password" className="input font-mono" placeholder={s.osb_key ? "••••••••••••" : ""} autoComplete="new-password" />
                  </Field>
                </div>
                {s.osb_key && (
                  <label className="flex items-center gap-2 text-xs text-mute"><input type="checkbox" name="clear_osb_key" className="accent-[#FF6A13]" /> Kayıtlı OSB anahtarını sil</label>
                )}
                <p className="text-sm text-mute">
                  Shopier&apos;de sattığın her ürünü, sitedeki ilanın düzenleme sayfasındaki <b className="text-bone">Shopier ürün numarası</b> alanıyla eşle. Satış gelince kod o ilanın stoğundan verilir, alıcıya e-postayla gider; alıcı sitede aynı e-postayla üyeyse siparişlerine de eklenir.
                </p>
              </AForm>
              <div className="grid content-start gap-3 rounded-2xl border border-line bg-coal p-5 text-sm">
                <div className="font-display font-bold">Shopier panelinde yapılacaklar</div>
                <ol className="grid list-decimal gap-2 pl-4 text-bone/80">
                  <li>Menüden <b>Ek Özellikler &gt; Sipariş Bildirimi</b> bölümünü aç.</li>
                  <li>Bildirim adresi olarak aşağıdaki adresi yapıştır.</li>
                  <li>Orada verilen <b>kullanıcı adı</b> ve <b>anahtarı</b> soldaki alanlara gir.</li>
                  <li>Shopier&apos;in test gönderimini dene; aşağıdaki OSB siparişleri sekmesinde &quot;Test&quot; olarak görünür.</li>
                </ol>
                <div className="mt-1">
                  <div className="label">OSB bildirim adresi</div>
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-ember/50 bg-ember/5 p-2.5">
                    <code className="flex-1 break-all text-xs">{osbUrl}</code>
                    <CopyButton text={osbUrl} label="" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="3. E-posta (kodların alıcıya gönderilmesi)">
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <AForm action={saveShopierSettings} submit="E-posta ayarlarını kaydet">
                <input type="hidden" name="section" value="mail" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="SMTP sunucusu"><input name="smtp_host" className="input" defaultValue={s.smtp_host} placeholder="smtp.gmail.com" /></Field>
                  <Field label="Port"><input name="smtp_port" inputMode="numeric" className="input" defaultValue={s.smtp_port || "587"} /></Field>
                  <Field label="Kullanıcı (e-posta)"><input name="smtp_user" className="input" defaultValue={s.smtp_user} autoComplete="off" /></Field>
                  <Field label="Şifre / uygulama şifresi" hint={s.smtp_pass ? "Kayıtlı. Değiştirmek için yenisini yaz." : undefined}>
                    <input name="smtp_pass" type="password" className="input" placeholder={s.smtp_pass ? "••••••••" : ""} autoComplete="new-password" />
                  </Field>
                  <Field label="Gönderen adı"><input name="mail_from_name" className="input" defaultValue={s.mail_from_name || s.site_name} /></Field>
                  <Field label="Gönderen e-posta" hint="Boşsa kullanıcı adresi kullanılır."><input name="mail_from_email" className="input" defaultValue={s.mail_from_email} /></Field>
                </div>
                <Toggle name="smtp_secure" label="SSL (465 portu)" defaultChecked={s.smtp_secure === "on"} />
                <Toggle name="mail_order_codes" label="Sitedeki siparişlerde de kodları e-postayla gönder" defaultChecked={s.mail_order_codes === "on"} />
              </AForm>
              <div className="grid content-start gap-3 rounded-2xl border border-line bg-coal p-5 text-sm">
                <div className="font-display font-bold">Gmail kullanacaksan</div>
                <p className="text-bone/80">Sunucu <code>smtp.gmail.com</code>, port <code>587</code>. Şifre olarak Google hesabında 2 adımlı doğrulamayı açıp oluşturduğun <b>uygulama şifresini</b> yaz.</p>
                <form action={sendTestMail} className="mt-2 grid gap-2">
                  <div className="label">Test e-postası gönder</div>
                  <input name="to" type="email" className="input" placeholder="kendi@adresin.com" />
                  <Submit className="btn-ghost"><Send className="h-4 w-4" /> Gönder</Submit>
                </form>
              </div>
            </div>
          </Card>
        </div>
      )}

      {sekme === "odemeler" && <Payments />}
      {sekme === "osb" && <OsbOrders />}
    </>
  );
}

async function Payments() {
  const rows = await q<any>(
    `SELECT p.*, u.username FROM shopier_payments p JOIN users u ON u.id = p.user_id ORDER BY p.id DESC LIMIT 200`,
  );
  return (
    <div className="grid gap-3">
      <p className="text-sm text-mute">
        Bekleyen bir ödeme Shopier panelinde başarılı görünüyorsa (müşteri ödeme sonrası sayfayı kapattıysa geri dönüş gelmemiş olabilir) &quot;Ödendi olarak işle&quot; ile bakiyeyi ve siparişi elle tamamlayabilirsin.
      </p>
      {rows.map((p) => {
        const [st, label] = PAY_STATUS[p.status] ?? ["pending", p.status];
        return (
          <div key={p.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span className="font-display font-bold text-mute">EP{p.id}</span>
              <span className="font-display text-lg font-extrabold text-blaze">{tl(p.charge)}</span>
              <span className="chip py-0.5">{p.kind === "cart" ? "Sepet ödemesi" : "Bakiye yükleme"}</span>
              <Link href={`/admin/uyeler/${p.user_id}`} className="font-semibold text-ember hover:underline">{p.username}</Link>
              <span className="text-mute">{p.buyer_name} {p.buyer_surname}</span>
              <span className="text-xs text-mute">{dateTimeTR(p.created_at)}</span>
              {p.order_id && <Link href={`/admin/siparisler/${p.order_id}`} className="text-xs font-semibold text-ember hover:underline">Sipariş #{p.order_id}</Link>}
              <span className="ml-auto"><StatusBadge status={st} label={label} /></span>
            </div>
            {(p.payment_id || p.note) && (
              <p className="mt-2 text-xs text-mute">
                {p.payment_id && <>Shopier ödeme no: <b className="text-bone">{p.payment_id}</b>{p.installment && Number(p.installment) > 1 ? `, ${p.installment} taksit` : ""}. </>}
                {p.note}
              </p>
            )}
            {p.status === "pending" && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <form action={markShopierPaid} className="flex flex-1 gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="payment_id" className="input flex-1" placeholder="Shopier sipariş/ödeme no (isteğe bağlı)" />
                  <ConfirmSubmit message="Shopier panelinde ödemenin geldiğini doğruladın mı? Tutar üyenin bakiyesine eklenecek." className="btn bg-mint text-void"><Check className="h-4 w-4" /> Ödendi olarak işle</ConfirmSubmit>
                </form>
                <form action={cancelShopierPayment}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmSubmit message="Bu ödeme iptal edilsin mi?" className="btn-danger w-full"><X className="h-4 w-4" /> İptal</ConfirmSubmit>
                </form>
              </div>
            )}
          </div>
        );
      })}
      {!rows.length && <p className="panel p-10 text-center text-sm text-mute"><CreditCard className="mx-auto mb-3 h-8 w-8" />Henüz kartla ödeme yok.</p>}
    </div>
  );
}

async function OsbOrders() {
  const rows = await q<any>("SELECT o.*, u.username FROM osb_orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 200");
  return (
    <div className="grid gap-3">
      {rows.map((o) => {
        const [st, label] = OSB_STATUS[o.status] ?? ["pending", o.status];
        const needs = ["unmatched", "no_stock", "partial"].includes(o.status);
        return (
          <div key={o.id} className={`panel p-4 ${needs ? "border-plasma/40" : ""}`}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span className="font-display font-bold">Shopier #{o.shopier_order_id}</span>
              {o.price != null && <span className="font-display font-bold text-blaze">{tl(o.price)}</span>}
              <span>{o.buyer_name}</span>
              <span className="text-mute">{o.email}</span>
              {o.username && <Link href={`/admin/uyeler/${o.user_id}`} className="text-xs font-semibold text-ember hover:underline">Üye: {o.username}</Link>}
              {o.order_id && <Link href={`/admin/siparisler/${o.order_id}`} className="text-xs font-semibold text-ember hover:underline">Sipariş #{o.order_id}</Link>}
              <span className="text-xs text-mute">{dateTimeTR(o.created_at)}</span>
              <span className="ml-auto flex items-center gap-2">
                {o.email_sent && <span className="inline-flex items-center gap-1 text-xs text-mint"><Mail className="h-3.5 w-3.5" /> e-postalandı</span>}
                <StatusBadge status={st} label={label} />
              </span>
            </div>
            <div className="mt-1 text-xs text-mute">Ürün no: {o.product_ids || "-"}{o.customer_note && <>, müşteri notu: {o.customer_note}</>}</div>
            {o.note && <p className="mt-2 whitespace-pre-line rounded-lg bg-coal p-2.5 text-xs text-bone/80">{o.note}</p>}
            {o.delivered_content && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-mute">Teslim edilen kodlar</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-coal p-3 font-mono">{o.delivered_content}</pre>
              </details>
            )}
            <div className="mt-3 flex flex-col gap-2 lg:flex-row">
              {needs && (
                <form action={osbManualDeliver} className="flex flex-1 flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={o.id} />
                  <input name="title" className="input sm:w-48" placeholder="Ürün adı" />
                  <input name="content" className="input flex-1" placeholder="Kod ya da teslim notu (alıcıya e-postalanır)" required />
                  <Submit className="btn-ember">Teslim et</Submit>
                </form>
              )}
              {o.delivered_content && o.email && (
                <form action={osbResend}>
                  <input type="hidden" name="id" value={o.id} />
                  <Submit className="btn-ghost w-full"><Mail className="h-4 w-4" /> E-postayı tekrar gönder</Submit>
                </form>
              )}
            </div>
          </div>
        );
      })}
      {!rows.length && (
        <p className="panel p-10 text-center text-sm text-mute">
          <BellRing className="mx-auto mb-3 h-8 w-8" />
          Henüz OSB bildirimi gelmedi. Shopier panelinden test bildirimi gönderdiğinde burada görünür.
        </p>
      )}
    </div>
  );
}
