# EpicPin

Oyun e-pin ve dijital kod mağazası. Next.js 15, PostgreSQL ve Tailwind CSS ile yapıldı; Vercel'e tek tıkla yüklenecek şekilde hazırlandı.

![EpicPin](public/brand/epicpin-banner.png)

## Özellikler

**Kullanıcı**
- Kayıt olma, giriş yapma
- Sepet ve bakiyeyle satın alma
- Otomatik teslimat: stoktaki kod ödeme anında Siparişlerim sayfasında görünür
- İade talebi, favoriler, bakiye hareketleri
- Bakiye yükleme (Havale/EFT, Papara, kripto vb. bildirim sistemi)
- Destek talebi açma ve mesajlaşma

**Yönetim paneli (`/admin`)**
- İlan ekleme/düzenleme, kapak fotoğrafı, eski fiyatla indirimli gösterme
- Otomatik teslimat için stoğa kod ekleme (her satıra bir kod)
- Kategori, banner (ana sayfa kayan alanı), duyuru ve blog yönetimi
- Üye ve yönetici ekleme, bakiye düzenleme, hesap askıya alma
- Ödeme yöntemleri, bakiye bildirimi onayı, iade onayı
- Manuel teslimatlı siparişleri teslim etme
- Site ayarları: logo, favicon, site adı, üst kampanya şeridi, sosyal medya
- Destek talepleri
- Kuponlar: yüzde veya sabit indirim, alt limit, kullanım limiti, son kullanma tarihi
- Bakım modu ve açılış penceresi (popup kampanya)
- Sık sorulanlar yönetimi, WhatsApp destek butonu, canlı satış şeridi
- Sipariş detayı ve yöneticiden iade (kodları stoğa geri alma seçeneğiyle)
- Siparişleri ve üyeleri Excel'e (CSV) aktarma
- İlan kopyalama, işlem kayıtları (hangi yönetici ne yaptı)

## Vercel'e yükleme

1. Bu repoyu GitHub'a yükle (zaten yüklüyse geç).
2. [vercel.com/new](https://vercel.com/new) adresinde repoyu seç ve **Deploy** de.
3. Vercel'de projenin **Storage** sekmesinden **Neon (Postgres)** veritabanı oluştur ve projeye bağla. Bölge olarak **Frankfurt (eu-central-1)** seç: site de Frankfurt'ta çalışacak şekilde ayarlı (`vercel.json`), ikisi aynı yerde olunca sayfalar çok daha hızlı açılır. `DATABASE_URL` otomatik eklenir.
4. **Settings → Environment Variables** bölümüne şunları ekle:

   | Değişken | Açıklama |
   | --- | --- |
   | `AUTH_SECRET` | Uzun, rastgele bir metin (ör. 40+ karakter). Oturumları şifreler. |
   | `ADMIN_EMAIL` | İlk yönetici hesabının e-postası |
   | `ADMIN_PASSWORD` | İlk yönetici hesabının şifresi |
   | `NEXT_PUBLIC_SITE_URL` | (İsteğe bağlı) Alan adın, ör. `https://epicpin.com` |

5. **Deployments** sekmesinden son yüklemeyi **Redeploy** et.

İlk açılışta tablolar ve örnek içerik (kategoriler, ilanlar, bannerlar, blog yazıları) otomatik oluşturulur. Yönetici hesabıyla giriş yapıp `/admin` adresinden her şeyi düzenleyebilirsin.

> Örnek bir üye hesabı da oluşturulur: `demo@epicpin.com` / `demo1234` (500 ₺ bakiyeli). Yayına çıkmadan önce panelden silebilir veya askıya alabilirsin.

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

`DATABASE_URL` tanımlı değilse proje `.data/` klasöründe gömülü bir Postgres (PGlite) kullanır, kurulum gerekmez. Varsayılan yönetici: `admin@epicpin.com` / `EpicPin2026!`.

## Ödemeler

**Havale / EFT, Papara, kripto:** Kullanıcı ödemeyi yapıp bildirim gönderir, sen panelden onaylayınca bakiye eklenir.

**Kredi / banka kartı (Shopier):** Yönetim panelinde **Shopier ve OSB** sayfasından ayarlanır.

1. Shopier hesabında **Entegrasyonlar > Modül Yönetimi** bölümünden API kullanıcı (API Key) ve API şifre (API Secret) bilgilerini al.
2. Aynı yerde **Geri dönüş URL** olarak `https://SITE-ADRESIN/api/shopier/callback` adresini kaydet (panel bu adresi kopyalanabilir şekilde gösterir).
3. Bilgileri panele gir, işlem ücretini belirle ve **Kartla ödemeyi aç**.

Müşteri bakiye yüklerken ya da sepette bakiyesi yetmediğinde **Kartla öde** seçeneğini görür. Ödeme imzası doğrulanınca bakiye anında yüklenir; sepetten ödendiyse sipariş otomatik oluşturulur ve kodlar teslim edilir.

**OSB (Otomatik Sipariş Bildirimi):** Ürünlerini Shopier mağazanda da satıyorsan:

1. Shopier'de **Ek Özellikler > Sipariş Bildirimi** bölümüne `https://SITE-ADRESIN/api/shopier/osb` adresini yaz, verilen kullanıcı adı ve anahtarı panele gir.
2. Her ilanın düzenleme sayfasında **Shopier ürün numarası** alanına Shopier ürün linkindeki numarayı yaz.

Shopier'den satış geldiğinde kod o ilanın stoğundan otomatik verilir ve alıcıya e-postayla gönderilir. Alıcı sitede aynı e-postayla üyeyse sipariş hesabına da eklenir. Eşleşmeyen ya da stoğu biten satışlar panelde işaretlenir, tek tıkla elle teslim edebilirsin.

**E-posta:** Kodların gönderilmesi için aynı sayfadan SMTP bilgilerini (ör. Gmail uygulama şifresi) gir ve test e-postası gönder.

## Marka dosyaları

`public/brand/` klasöründe logo (açık ve koyu zemin), işaret, Twitter/X banner'ı ve paylaşım görseli bulunur.
