import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { q, one } from "./db";

/** Herkese açık veriler önbellekte tutulur; yönetici bir şeyi değiştirince bu etiketler temizlenir. */
export const TAGS = ["settings", "categories", "listings", "banners", "announcements", "posts", "faqs", "stats"] as const;
// Etiketle anında temizlenir; yine de en geç birkaç dakikada bir tazelenir
const opts = (tag: string) => ({ tags: [tag], revalidate: tag === "settings" || tag === "announcements" ? 120 : 600 });

export type Settings = Record<string, string>;

export const getSettings = cache(
  unstable_cache(
    async (): Promise<Settings> => {
      const rows = await q<{ key: string; value: string }>("SELECT key, value FROM settings");
      const s: Settings = {};
      for (const r of rows) s[r.key] = r.value;
      return s;
    },
    ["settings"],
    opts("settings"),
  ),
);

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  image_id: string | null;
  sort: number;
  active: boolean;
  show_in_bar: boolean;
  listing_count?: number;
};

export const getCategories = cache(
  unstable_cache(
    async (all = false) =>
      q<Category>(
        `SELECT c.*, (SELECT COUNT(*)::int FROM listings l WHERE l.category_id = c.id AND l.active) AS listing_count
         FROM categories c ${all ? "" : "WHERE c.active"} ORDER BY c.sort, c.name`,
      ),
    ["categories"],
    { tags: ["categories", "listings"], revalidate: 600 },
  ),
);

export type Listing = {
  id: number;
  title: string;
  slug: string;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  category_color: string | null;
  category_icon: string | null;
  description: string;
  price: number;
  old_price: number | null;
  cover_image_id: string | null;
  delivery_type: "auto" | "manual";
  manual_stock: number;
  active: boolean;
  featured: boolean;
  sold_count: number;
  stock: number;
  created_at: string;
};

export const LISTING_SELECT = `
  SELECT l.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color, c.icon AS category_icon,
    CASE WHEN l.delivery_type = 'auto'
      THEN (SELECT COUNT(*)::int FROM stock_codes s WHERE s.listing_id = l.id AND s.order_item_id IS NULL)
      ELSE l.manual_stock END AS stock
  FROM listings l LEFT JOIN categories c ON c.id = l.category_id`;

async function _getListings(opts: {
  category?: number;
  search?: string;
  sort?: string;
  featured?: boolean;
  discounted?: boolean;
  limit?: number;
  includeInactive?: boolean;
} = {}) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (!opts.includeInactive) where.push("l.active");
  if (opts.category) {
    params.push(opts.category);
    where.push(`l.category_id = $${params.length}`);
  }
  if (opts.search) {
    params.push(`%${opts.search}%`);
    where.push(`(l.title ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
  }
  if (opts.featured) where.push("l.featured");
  if (opts.discounted) where.push("l.old_price IS NOT NULL AND l.old_price > l.price");
  const order =
    opts.sort === "price_asc"
      ? "l.price ASC"
      : opts.sort === "price_desc"
        ? "l.price DESC"
        : opts.sort === "popular"
          ? "l.sold_count DESC"
          : opts.sort === "discount"
            ? "(COALESCE(l.old_price, l.price) - l.price) / NULLIF(COALESCE(l.old_price, l.price),0) DESC"
            : "l.created_at DESC, l.id DESC";
  const sql = `${LISTING_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ${order} ${
    opts.limit ? `LIMIT ${Math.floor(opts.limit)}` : ""
  }`;
  return q<Listing>(sql, params);
}

export const getListings = unstable_cache(_getListings, ["listings"], { tags: ["listings", "categories"], revalidate: 600 });

export const getListingBySlug = unstable_cache(
  async (slug: string) => one<Listing>(`${LISTING_SELECT} WHERE l.slug = $1`, [slug]),
  ["listing-by-slug"],
  { tags: ["listings", "categories"], revalidate: 600 },
);

export async function getFavoriteIds(userId?: number) {
  if (!userId) return new Set<number>();
  const rows = await q<{ listing_id: number }>("SELECT listing_id FROM favorites WHERE user_id = $1", [userId]);
  return new Set(rows.map((r) => r.listing_id));
}

export type Announcement = { id: number; title: string; content: string; kind: string; link: string; in_ticker: boolean; active: boolean; created_at: string };

export const getAnnouncements = cache(
  unstable_cache(async () => q<Announcement>("SELECT * FROM announcements WHERE active ORDER BY created_at DESC, id DESC"), ["announcements"], opts("announcements")),
);

export type Banner = { id: number; title: string; subtitle: string; cta_text: string; cta_link: string; label: string; theme: string; image_id: string | null; sort: number; active: boolean };

export const getBanners = unstable_cache(async () => q<Banner>("SELECT * FROM banners WHERE active ORDER BY sort, id"), ["banners"], opts("banners"));

export type Post = { id: number; title: string; slug: string; excerpt: string; content: string; cover_image_id: string | null; published: boolean; created_at: string };

export const getPosts = unstable_cache(
  async (limit?: number) => q<Post>(`SELECT * FROM blog_posts WHERE published ORDER BY created_at DESC, id DESC ${limit ? `LIMIT ${Math.floor(limit)}` : ""}`),
  ["posts"],
  opts("posts"),
);

export const getPostBySlug = unstable_cache(async (slug: string) => one<Post>("SELECT * FROM blog_posts WHERE slug = $1 AND published", [slug]), ["post"], opts("posts"));

export type Faq = { id: number; question: string; answer: string; sort: number; active: boolean };
export const getFaqs = unstable_cache(async () => q<Faq>("SELECT * FROM faqs WHERE active ORDER BY sort, id"), ["faqs"], opts("faqs"));

/** Son gerçek siparişler (kullanıcı adları maskelenir). */
export const getRecentSales = unstable_cache(
  async () =>
    q<{ username: string; title: string; slug: string | null; created_at: string; color: string | null; icon: string | null }>(
      `SELECT u.username, oi.title, l.slug, o.created_at, c.color, c.icon
       FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN users u ON u.id = o.user_id
       LEFT JOIN listings l ON l.id = oi.listing_id LEFT JOIN categories c ON c.id = l.category_id
       ORDER BY oi.id DESC LIMIT 14`,
    ),
  ["recent-sales"],
  { tags: ["stats", "listings"], revalidate: 60 },
);

export const getStats = unstable_cache(
  async () =>
    (await one<{ products: number; categories: number; sold: number; delivered: number }>(`SELECT
      (SELECT COUNT(*)::int FROM listings WHERE active) AS products,
      (SELECT COUNT(*)::int FROM categories WHERE active) AS categories,
      (SELECT COALESCE(SUM(sold_count),0)::int FROM listings) AS sold,
      (SELECT COUNT(*)::int FROM stock_codes WHERE order_item_id IS NOT NULL) AS delivered`))!,
  ["stats"],
  { tags: ["stats", "listings"], revalidate: 300 },
);
