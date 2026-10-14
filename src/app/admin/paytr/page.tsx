import Link from "next/link";
import { headers } from "next/headers";
import { CreditCard, CircleCheck, CircleAlert, ExternalLink, Send, Check, X, RotateCcw } from "lucide-react";
import { q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { savePaymentSettings, sendTestMail, markCardPaid, cancelCardPayment, retryCardOrder } from "@/app/actions/admin";
import { AdminTitle, Card, Field, Toggle } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";
import { ConfirmSubmit } from "@/components/admin/Confirm";
import { CopyButton } from "@/components/CopyButton";
import { StatusBadge } from "@/components/StatusBadge";
import { Submit } from "@/components/FormBits";

const PAY_STATUS: Record<string, [string, string]> = { pending: ["pending", "Bekliyor"], paid: ["approved", "Ödendi"], failed: ["rejected", "Başarısız"] };

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
  const base = (process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`).replace(/\/$/, "");
  const notifyUrl = `${base}/api/paytr/bildirim`;
  const rows = await q<{ key: string; value: string }>("SELECT key, value FROM settings");
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const [m] = await q<any>("SELECT * FROM payment_methods WHERE kind = 'paytr' ORDER BY id LIMIT 1");
  const payReady = !!(s.paytr_merchant_id && s.paytr_merchant_key && s.paytr_merchant_salt);
  const mailReady = !!(s.smtp_host && s.smtp_user && s.smtp_pass);
  const [c] = await q<{ p: number; o: number; t: number }>(`SELECT
    (SELECT COUNT(*)::int FROM card_payments WHERE status = 'pending' AND created_at > now() - interval '2 days') AS p,
    (SELECT COUNT(*)::int FROM card_payments WHERE status = 'paid' AND kind = 'cart' AND order_id IS NULL) AS o,
    (SELECT COALESCE(SUM(amount),0)::int FROM card_payments WHERE status = 'paid' AND paid_at > now() - interval '30 days') AS t`);
  const secret = (k: string, label: string, hint: string) => (
    <Field label={label} hint={s[k] ? "Kayıtlı. Değiştirmek için yenisini yaz." : hint}>
      <input name={k} type="password" className="input font-mono" placeholder={s[k] ? "••••••••••••" : ""} autoComplete="new-password" />
      {s[k] && (
        <label className="mt-1.5 flex items-center gap-2 text-xs text-mute"><input type="checkbox" name={`clear_${k}`} className="accent-[#FF6A13]" /> Kayıtlı değeri sil</label>
      )}
    </Field>
  );

  return (
    <>
      <AdminTitle title="PayTR ve e-posta" sub={`Kartla ödeme altyapısı. Son 30 günde kartla ${tl(c.t)} tahsil edildi.`}>
        <a href="https://www.paytr.com" target="_blank" rel="noreferrer" className="btn-ghost"><ExternalLink className="h-4 w-4" /> PayTR mağaza paneli</a>
      </AdminTitle>
      <div className="mb-5 flex flex-wrap gap-2">
        {([["ayarlar", "Ayarlar", 0], ["odemeler", "Kart ödemeleri", c.p + c.o]] as const).map(([k, l, n]) => (
          <Link key={k} href={`/admin/paytr?sekme=${k}`} className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${sekme === k ? "border-ember bg-ember text-void" : "border-line bg-ash"}`}>
            {l}
            {n > 0 && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] ${sekme === k ? "bg-void text-ember" : "bg-plasma text-white"}`}>{n}</span>}
          </Link>
        ))}
      </div>

      {sekme === "ayarlar" ? (
        <div className="grid gap-5">
          <div className="flex flex-wrap gap-2">
            <Ok on={payReady && !!m?.active}>Kartla ödeme {payReady && m?.active ? "açık" : "kapalı"}</Ok>
            {s.paytr_test_mode === "on" && <span className="inline-flex items-center rounded-lg bg-blaze/15 px-2.5 py-1 text-xs font-bold text-blaze">Test modu açık</span>}
            <Ok on={mailReady}>E-posta {mailReady ? "hazır" : "ayarlanmadı"}</Ok>
          </div>

          <Card title="1. PayTR kartla ödeme (iFrame API)">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <AForm action={savePaymentSettings} submit="PayTR ayarlarını kaydet">
                <input type="hidden" name="section" value="paytr" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Mağaza No (merchant_id)"><input name="paytr_merchant_id" inputMode="numeric" className="input font-mono" defaultValue={s.paytr_merchant_id} autoComplete="off" /></Field>
                  {secret("paytr_merchant_key", "Mağaza Parola (merchant_key)", "Henüz girilmedi.")}
                  {secret("paytr_merchant_salt", "Mağaza Gizli Anahtar (merchant_salt)", "Henüz girilmedi.")}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Sitede görünen adı"><input name="card_name" className="input" defaultValue={m?.name ?? "Kredi / Banka Kartı"} /></Field>
                  <Field label="İşlem ücreti (%)" hint="PayTR komisyonunu müşteriye yansıtmak için. 0 yazarsan sen karşılarsın."><input name="card_commission" inputMode="decimal" className="input" defaultValue={m?.commission ?? 0} /></Field>
                  <Field label="En az yükleme (₺)"><input name="card_min" inputMode="decimal" className="input" defaultValue={m?.min_amount ?? 10} /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Toggle name="paytr_installment" label="Taksit seçeneklerini göster" defaultChecked={s.paytr_installment === "on"} hint="Kapalıyken sadece tek çekim yapılır." />
                  <Field label="En fazla taksit" hint="0: PayTR'nin izin verdiği en yüksek sayı">
                    <select name="paytr_max_installment" className="input" defaultValue={s.paytr_max_installment || "0"}>
                      {[0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => <option key={i} value={i}>{i === 0 ? "Sınırsız" : `${i} taksit`}</option>)}
                    </select>
                  </Field>
                  <Toggle name="paytr_test_mode" label="Test modu" defaultChecked={s.paytr_test_mode === "on"} hint="Açıkken test kartlarıyla ödeme denenir, gerçek para çekilmez." />
                  <Toggle name="paytr_debug" label="Hata ayıklama (debug)" defaultChecked={s.paytr_debug === "on"} hint="Kurulum sırasında aç: PayTR hataların nedenini açıkça yazar." />
                </div>
                <Toggle name="card_active" label="Kartla ödemeyi aç" defaultChecked={!!m?.active} hint="Açıkken Bakiye yükle sayfasında ve sepette Kartla öde seçeneği çıkar." />
              </AForm>
              <div className="grid content-start gap-3 rounded-2xl border border-line bg-coal p-5 text-sm">
                <div className="font-display font-bold">PayTR mağaza panelinde yapılacaklar</div>
                <ol className="grid list-decimal gap-2 pl-4 text-bone/80">
                  <li><b>Destek &amp; Kurulum &gt; Entegrasyon Bilgileri</b> bölümünden Mağaza No, Mağaza Parola ve Mağaza Gizli Anahtar bilgilerini al, soldaki alanlara gir.</li>
                  <li><b>Destek &amp; Kurulum &gt; Ayarlar &gt; Bildirim URL Ayarları</b> bölümüne aşağıdaki adresi yapıştır. Siten SSL&apos;li olduğu için protokol HTTPS olmalı.</li>
                  <li>Test modunu açıp bir test ödemesi yap. PayTR panelindeki İşlemler sayfasında durum &quot;Başarılı&quot; görünüyorsa kurulum tamamdır; sonra test modunu kapat.</li>
                </ol>
                <div className="mt-1">
                  <div className="label">Bildirim URL</div>
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-ember/50 bg-ember/5 p-2.5">
                    <code className="flex-1 break-all text-xs">{notifyUrl}</code>
                    <CopyButton text={notifyUrl} label="" />
                  </div>
                </div>
                <p className="text-xs text-mute">PayTR ödeme sonucunu bu adrese bildirir; imza doğrulanınca bakiye yüklenir ya da sepet siparişi oluşturulup kodlar teslim edilir. İşlem PayTR panelinde &quot;Devam Ediyor&quot; kalırsa bu adres yanlış girilmiştir.</p>
              </div>
            </div>
          </Card>

          <Card title="2. E-posta (kodların müşteriye gönderilmesi)">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <AForm action={savePaymentSettings} submit="E-posta ayarlarını kaydet">
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
                <Toggle name="mail_order_codes" label="Siparişlerde kodları e-postayla da gönder" defaultChecked={s.mail_order_codes === "on"} />
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
      ) : (
        <Payments />
      )}
    </>
  );
}

async function Payments() {
  const rows = await q<any>(`SELECT p.*, u.username FROM card_payments p JOIN users u ON u.id = p.user_id ORDER BY p.id DESC LIMIT 200`);
  return (
    <div className="grid gap-3">
      <p className="text-sm text-mute">
        Ödemeler PayTR bildirimiyle otomatik işlenir. Bekleyen bir ödeme PayTR panelinde başarılı görünüyorsa (bildirim adresi hatalıyken yapılmış olabilir) &quot;Ödendi olarak işle&quot; ile tamamlayabilirsin.
      </p>
      {rows.map((p) => {
        const [st, label] = PAY_STATUS[p.status] ?? ["pending", p.status];
        const stuck = p.status === "paid" && p.kind === "cart" && !p.order_id;
        return (
          <div key={p.id} className={`panel p-4 ${stuck ? "border-plasma/40" : ""}`}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span className="font-mono text-xs text-mute">{p.merchant_oid ?? `#${p.id}`}</span>
              <span className="font-display text-lg font-extrabold text-blaze">{tl(p.charge)}</span>
              <span className="chip py-0.5">{p.kind === "cart" ? "Sepet ödemesi" : "Bakiye yükleme"}</span>
              {p.test_mode && <span className="chip py-0.5 text-blaze">Test</span>}
              <Link href={`/admin/uyeler/${p.user_id}`} className="font-semibold text-ember hover:underline">{p.username}</Link>
              <span className="text-mute">{p.buyer_name}</span>
              <span className="text-xs text-mute">{dateTimeTR(p.created_at)}</span>
              {p.order_id && <Link href={`/admin/siparisler/${p.order_id}`} className="text-xs font-semibold text-ember hover:underline">Sipariş #{p.order_id}</Link>}
              <span className="ml-auto"><StatusBadge status={st} label={label} /></span>
            </div>
            {(p.total_amount || p.note) && (
              <p className="mt-2 text-xs text-mute">
                {p.total_amount != null && <>Tahsil edilen: <b className="text-bone">{tl(p.total_amount)}</b>{p.payment_type ? ` (${p.payment_type === "eft" ? "EFT" : "kart"})` : ""}. </>}
                {p.note}
              </p>
            )}
            {p.status === "pending" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={markCardPaid}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmSubmit message="PayTR panelinde bu ödemenin başarılı olduğunu doğruladın mı? Tutar üyenin bakiyesine eklenecek." className="btn bg-mint text-void"><Check className="h-4 w-4" /> Ödendi olarak işle</ConfirmSubmit>
                </form>
                <form action={cancelCardPayment}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmSubmit message="Bu ödeme iptal edilsin mi?" className="btn-danger"><X className="h-4 w-4" /> İptal</ConfirmSubmit>
                </form>
              </div>
            )}
            {stuck && (
              <form action={retryCardOrder} className="mt-3">
                <input type="hidden" name="id" value={p.id} />
                <Submit className="btn-ghost"><RotateCcw className="h-4 w-4" /> Siparişi yeniden oluştur</Submit>
              </form>
            )}
          </div>
        );
      })}
      {!rows.length && (
        <p className="panel p-10 text-center text-sm text-mute">
          <CreditCard className="mx-auto mb-3 h-8 w-8" />
          Henüz kartla ödeme yok.
        </p>
      )}
    </div>
  );
}
