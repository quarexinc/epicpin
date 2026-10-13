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

## Vercel'e yükleme

1. Bu repoyu GitHub'a yükle (zaten yüklüyse geç).
2. [vercel.com/new](https://vercel.com/new) adresinde repoyu seç ve **Deploy** de.
3. Vercel'de projenin **Storage** sekmesinden **Neon (Postgres)** veritabanı oluştur ve projeye bağla. `DATABASE_URL` otomatik eklenir.
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

## Ödemeler hakkında

Bakiye yükleme şu an **bildirim + onay** mantığıyla çalışır: kullanıcı IBAN/Papara/kripto adresine ödeme yapar, bildirim gönderir; sen panelden onaylayınca bakiye eklenir. Kredi kartıyla anlık ödeme için PayTR, iyzico veya Shopier gibi bir sanal POS hesabı açıp API entegrasyonu eklemek gerekir.

## Marka dosyaları

`public/brand/` klasöründe logo (açık ve koyu zemin), işaret, Twitter/X banner'ı ve paylaşım görseli bulunur.
