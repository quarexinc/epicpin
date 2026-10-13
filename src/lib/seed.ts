import bcrypt from "bcryptjs";
import type { Q } from "./db";
import { slugify } from "./utils";

function code(prefix: string) {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join("");
  return `${prefix}-${part()}-${part()}-${part()}`;
}

export async function seedDatabase(q: Q) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@epicpin.com";
  const adminPass = process.env.ADMIN_PASSWORD || "EpicPin2026!";
  await q("INSERT INTO users (username, email, password_hash, role, balance) VALUES ($1,$2,$3,'admin',0)", [
    "admin",
    adminEmail.toLowerCase(),
    await bcrypt.hash(adminPass, 10),
  ]);
  await q("INSERT INTO users (username, email, password_hash, role, balance) VALUES ($1,$2,$3,'user',500)", [
    "demooyuncu",
    "demo@epicpin.com",
    await bcrypt.hash("demo1234", 10),
  ]);

  const settings: Record<string, string> = {
    site_name: "EpicPin",
    tagline: "Oyun kodları, e-pin ve dijital kartlar. Saniyeler içinde hesabında.",
    footer_about:
      "EpicPin; Valorant VP, PUBG UC, Robux, Steam cüzdan kodu ve daha fazlasını anında teslim eden dijital ürün mağazasıdır.",
    contact_email: "destek@epicpin.com",
    instagram: "https://instagram.com/",
    discord: "https://discord.com/",
    x: "https://x.com/",
    youtube: "https://youtube.com/",
    promo1_title: "Valorant",
    promo1_text: "Yeni sezon VP paketleri stokta",
    promo1_link: "/kategori/valorant",
    promo2_title: "PUBG Mobile",
    promo2_text: "UC alımında anında teslimat",
    promo2_link: "/kategori/pubg-mobile",
    promo3_title: "Steam",
    promo3_text: "Cüzdan kodları 7/24 otomatik",
    promo3_link: "/kategori/steam",
  };
  for (const [k, v] of Object.entries(settings)) await q("INSERT INTO settings (key, value) VALUES ($1,$2)", [k, v]);

  const cats = [
    ["Valorant", "Swords", "#FF4655", "VP paketleri ve Radianite noktaları"],
    ["PUBG Mobile", "Crosshair", "#F2A900", "UC paketleri, anında hesabına"],
    ["League of Legends", "Crown", "#C89B3C", "RP kodları tüm sunucular için"],
    ["Roblox", "Box", "#E8483C", "Robux hediye kartları"],
    ["Steam", "Monitor", "#66C0F4", "Steam cüzdan kodları"],
    ["Mobile Legends", "Shield", "#4F7DF3", "Elmas paketleri"],
    ["Free Fire", "Flame", "#FF7A00", "Elmas yüklemeleri"],
    ["Google Play", "Smartphone", "#34A853", "Google Play hediye kartları"],
    ["Counter-Strike 2", "Target", "#DE9B35", "Kasa anahtarları ve bakiye"],
    ["Discord", "MessageCircle", "#5865F2", "Nitro abonelik kodları"],
    ["Razer Gold", "Coins", "#44D62C", "Razer Gold pinleri"],
    ["Brawl Stars", "Star", "#FFCE00", "Elmas paketleri"],
  ];
  const catIds: Record<string, number> = {};
  for (let i = 0; i < cats.length; i++) {
    const [name, icon, color, desc] = cats[i];
    const r = await q<{ id: number }>(
      "INSERT INTO categories (name, slug, icon, color, description, sort, show_in_bar) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [name, slugify(name), icon, color, desc, i, i < 9],
    );
    catIds[name] = r[0].id;
  }

  // [başlık, kategori, fiyat, eski fiyat, prefix, öne çıkan]
  const items: [string, string, number, number | null, string, boolean][] = [
    ["Valorant 475 VP", "Valorant", 189.9, 219.9, "VLR", true],
    ["Valorant 1000 VP", "Valorant", 379.9, 449.9, "VLR", true],
    ["Valorant 2050 VP", "Valorant", 749.9, null, "VLR", false],
    ["PUBG Mobile 325 UC", "PUBG Mobile", 214.9, 239.9, "PUBG", true],
    ["PUBG Mobile 660 UC", "PUBG Mobile", 419.9, 489.9, "PUBG", true],
    ["PUBG Mobile 1800 UC", "PUBG Mobile", 1079.9, null, "PUBG", false],
    ["LoL 650 RP", "League of Legends", 159.9, null, "LOL", false],
    ["LoL 1380 RP", "League of Legends", 319.9, 359.9, "LOL", true],
    ["Roblox 400 Robux", "Roblox", 249.9, 279.9, "RBX", true],
    ["Roblox 800 Robux", "Roblox", 479.9, null, "RBX", false],
    ["Steam 100 TL Cüzdan Kodu", "Steam", 104.9, null, "STM", true],
    ["Steam 250 TL Cüzdan Kodu", "Steam", 259.9, 274.9, "STM", false],
    ["Mobile Legends 257 Elmas", "Mobile Legends", 229.9, 259.9, "MLB", false],
    ["Free Fire 520 Elmas", "Free Fire", 179.9, 199.9, "FF", true],
    ["Google Play 100 TL", "Google Play", 102.9, null, "GPL", false],
    ["CS2 Kasa Anahtarı", "Counter-Strike 2", 89.9, 99.9, "CS", false],
    ["Discord Nitro 1 Ay", "Discord", 299.9, 349.9, "DSC", true],
    ["Razer Gold 50 TL", "Razer Gold", 52.9, null, "RZR", false],
    ["Brawl Stars 170 Elmas", "Brawl Stars", 349.9, 389.9, "BS", false],
  ];
  for (const [title, cat, price, old, prefix, featured] of items) {
    const sold = Math.floor(Math.random() * 900) + 40;
    const r = await q<{ id: number }>(
      `INSERT INTO listings (title, slug, category_id, description, price, old_price, delivery_type, featured, sold_count)
       VALUES ($1,$2,$3,$4,$5,$6,'auto',$7,$8) RETURNING id`,
      [
        title,
        slugify(title),
        catIds[cat],
        `${title} kodu, ödemen onaylandığı anda Siparişlerim sayfasında görünür.\n\nKullanım: Kodu kopyala, oyunun ya da platformun kod kullanma ekranına yapıştır ve onayla. Bakiye birkaç saniye içinde hesabına geçer.\n\nTürkiye bölgesi hesaplarda çalışır. Kod kullanıldıktan sonra iade edilemez; kullanılmamış kodlar için 24 saat içinde iade talebi açabilirsin.`,
        price,
        old,
        featured,
        sold,
      ],
    );
    for (let i = 0; i < 25; i++) await q("INSERT INTO stock_codes (listing_id, code) VALUES ($1,$2)", [r[0].id, code(prefix)]);
  }
  // Manuel teslimatlı örnek
  await q(
    `INSERT INTO listings (title, slug, category_id, description, price, old_price, delivery_type, manual_stock, sold_count)
     VALUES ($1,$2,$3,$4,$5,$6,'manual',50,$7)`,
    [
      "Valorant Hesabına VP Yükleme (Riot ID ile)",
      "valorant-riot-id-vp-yukleme",
      catIds["Valorant"],
      "Riot ID bilgini sipariş sonrası destek talebinden ilet, ekibimiz 15 dakika içinde yüklemeyi tamamlar.",
      399.9,
      449.9,
      112,
    ],
  );

  const banners = [
    ["Valorant VP'de haftanın en düşük fiyatı", "1000 VP paketinde %15 indirim, kod saniyeler içinde hesabında.", "Fırsatı yakala", "/kategori/valorant", "Haftanın fırsatı", "ember"],
    ["UC bitti mi? Maç beklemez.", "PUBG Mobile UC paketleri 7/24 otomatik teslim.", "UC al", "/kategori/pubg-mobile", "Anında teslim", "plasma"],
    ["Steam cüzdanına hızlı yol", "100 TL'den başlayan cüzdan kodları, kur farkı yok.", "Kodları gör", "/kategori/steam", "Yeni stok", "violet"],
    ["Robux ile avatarını yenile", "400 ve 800 Robux kartları stokta.", "Robux al", "/kategori/roblox", "Popüler", "lime"],
  ];
  for (let i = 0; i < banners.length; i++) {
    const b = banners[i];
    await q("INSERT INTO banners (title, subtitle, cta_text, cta_link, label, theme, sort) VALUES ($1,$2,$3,$4,$5,$6,$7)", [...b, i]);
  }

  const methods = [
    ["Havale / EFT", "bank", "EpicPin Dijital Ltd. Şti.", "TR00 0000 0000 0000 0000 0000 00", "Açıklama kısmına kullanıcı adını yaz. Ödeme 5-15 dakika içinde onaylanır.", 0, 20],
    ["Papara", "papara", "EpicPin", "1234567890", "Papara numarasına gönder, açıklamaya kullanıcı adını yaz.", 0, 10],
    ["Kripto (USDT TRC20)", "crypto", "USDT TRC20", "TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "Sadece TRC20 ağından gönder. Tutar TL karşılığı üzerinden yüklenir.", 2, 100],
  ];
  for (let i = 0; i < methods.length; i++)
    await q(
      "INSERT INTO payment_methods (name, kind, account_name, account_no, instructions, commission, min_amount, sort) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [...methods[i], i],
    );

  const anns = [
    ["Valorant yeni sezon VP paketleri stokta", "Tüm VP paketleri otomatik teslimatla satışta.", "promo", "/kategori/valorant"],
    ["Papara ile bakiye yükleme açıldı", "Papara ödemeleri ortalama 5 dakikada onaylanıyor.", "info", "/bakiye-yukle"],
    ["Destek ekibimiz 7/24 aktif", "Siparişinle ilgili her konuda destek talebi açabilirsin.", "info", "/destek"],
  ];
  for (const a of anns) await q("INSERT INTO announcements (title, content, kind, link) VALUES ($1,$2,$3,$4)", a);

  const posts = [
    [
      "E-pin nedir, nasıl kullanılır?",
      "Oyun içi para birimi almanın en hızlı yolu olan e-pin kodlarını adım adım anlattık.",
      "E-pin, bir oyun ya da platform için önceden ödenmiş dijital koddur. Satın aldığın anda sana benzersiz bir kod verilir ve bu kodu oyunun kod kullanma ekranına girdiğinde bakiye hesabına geçer.\n\nNeden e-pin? Kart bilgilerini oyun şirketine vermeden alışveriş yaparsın, harcamanı kontrol edersin ve hediye olarak da gönderebilirsin.\n\nEpicPin'de e-pin almak üç adım: ilanı seç, bakiyenle öde, kod anında Siparişlerim sayfasında görünür. Kodu kopyala, oyunda kullan, bitti.",
    ],
    [
      "Valorant VP yüklerken dikkat etmen gereken 4 şey",
      "Bölge, hesap güvenliği ve kodu doğru yere girmek. Kısa bir kontrol listesi.",
      "Önce hesabının bölgesini kontrol et: Türkiye bölgesi kodları yalnızca TR hesaplarda çalışır.\n\nKodu Riot istemcisindeki mağaza > VP satın al > Ön ödemeli kartlar ve kodlar bölümüne gir.\n\nKodunu kimseyle paylaşma; kullanılmış bir kod geri alınamaz.\n\nSorun yaşarsan sipariş numaranla destek talebi aç, ekibimiz dakikalar içinde dönüş yapar.",
    ],
    [
      "PUBG Mobile UC mi, Prime Plus mı?",
      "Hangi paket senin oyun tarzına daha uygun? Fiyat/performans karşılaştırması.",
      "UC, oyun içi mağazada istediğin her şeyi almanı sağlar: Royale Pass, kostümler, silah kaplamaları.\n\nPrime Plus ise aylık abonelik gibi çalışır; her gün belli miktarda UC ve indirimler verir. Her gün oynuyorsan uzun vadede daha kârlıdır.\n\nArada bir oynayan biriysen ihtiyaç duyduğun anda UC paketi almak daha mantıklı.",
    ],
  ];
  for (const [t, e, c] of posts)
    await q("INSERT INTO blog_posts (title, slug, excerpt, content) VALUES ($1,$2,$3,$4)", [t, slugify(t), e, c]);
}

/** Sonradan eklenen özelliklerin varsayılan içerikleri (bir kez çalışır). */
export async function seedExtras(q: Q) {
  // Kartla ödeme yöntemi (PayTR bilgileri girilene kadar kapalı)
  const card = await q("SELECT 1 FROM settings WHERE key = 'paytr_seeded'");
  if (!card.length) {
    const ex = await q("SELECT 1 FROM payment_methods WHERE kind = 'paytr'");
    if (!ex.length)
      await q(
        "INSERT INTO payment_methods (name, kind, account_name, account_no, instructions, commission, min_amount, active, sort) VALUES ($1,'paytr','','',$2,0,10,false,-1)",
        ["Kredi / Banka Kartı", "Kart bilgilerini PayTR güvenli ödeme ekranında gir, bakiyen ödeme onaylandığı anda yüklensin."],
      );
    await q("INSERT INTO settings (key, value) VALUES ('paytr_seeded', '1'), ('mail_order_codes', 'on') ON CONFLICT (key) DO NOTHING");
  }
  const done = await q<{ value: string }>("SELECT value FROM settings WHERE key = 'extras_seeded'");
  if (done.length) return;
  const faqs = [
    ["Kodum ne zaman gelir?", "Otomatik teslimatlı ürünlerde kod ödeme anında Siparişlerim sayfasında görünür. Manuel ürünler ortalama 15 dakikada teslim edilir."],
    ["Bakiye yükleme ne kadar sürer?", "Havale/EFT ve Papara bildirimleri genellikle 5-15 dakika içinde onaylanır."],
    ["Kod çalışmıyor, ne yapmalıyım?", "Hesap bölgeni kontrol et. Sorun devam ederse sipariş numaranla destek talebi aç veya sipariş sayfasından iade talebi oluştur."],
    ["İade alabilir miyim?", "Kullanılmamış kodlar için iade talebi açabilirsin. Onaylanan iadeler bakiyene eklenir."],
    ["İndirim kodunu nereye yazacağım?", "Sepet sayfasındaki İndirim kodu alanına yaz ve Uygula'ya bas. İndirim toplam tutardan düşülür."],
  ];
  for (let i = 0; i < faqs.length; i++) await q("INSERT INTO faqs (question, answer, sort) VALUES ($1,$2,$3)", [...faqs[i], i]);
  await q("INSERT INTO coupons (code, kind, value, min_total, max_uses) VALUES ('EPIC10', 'percent', 10, 100, 500) ON CONFLICT (code) DO NOTHING");
  const defaults: Record<string, string> = {
    maintenance_on: "",
    maintenance_text: "Kısa bir bakım çalışması yapıyoruz. Birazdan buradayız.",
    popup_on: "",
    popup_title: "İlk siparişine özel %10 indirim",
    popup_text: "Sepette EPIC10 kodunu kullan, 100 ₺ ve üzeri siparişlerde %10 indirim kazan.",
    popup_link: "/ilanlar",
    popup_button: "Alışverişe başla",
    live_feed_on: "on",
  };
  for (const [k, v] of Object.entries(defaults)) await q("INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING", [k, v]);
  await q("INSERT INTO settings (key, value) VALUES ('extras_seeded', '1') ON CONFLICT (key) DO NOTHING");
}
