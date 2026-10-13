import type { MetadataRoute } from "next";
import { getCategories, getListings, getPosts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  try {
    const [cats, listings, posts] = await Promise.all([getCategories(), getListings({}), getPosts()]);
    return [
      { url: base, changeFrequency: "daily", priority: 1 },
      { url: `${base}/ilanlar`, changeFrequency: "daily", priority: 0.9 },
      { url: `${base}/kategoriler`, priority: 0.8 },
      { url: `${base}/blog`, priority: 0.6 },
      ...cats.map((c) => ({ url: `${base}/kategori/${c.slug}`, priority: 0.8 })),
      ...listings.map((l) => ({ url: `${base}/ilan/${l.slug}`, priority: 0.7 })),
      ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: new Date(p.created_at), priority: 0.5 })),
    ];
  } catch {
    return [{ url: base }];
  }
}
