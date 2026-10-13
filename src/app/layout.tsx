import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSettings } from "@/lib/data";
import { img } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s.site_name || "EpicPin";
  const fav = img(s.favicon_image_id);
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return {
    metadataBase: new URL(base),
    title: { default: `${name} | Oyun E-Pin ve Dijital Kod Mağazası`, template: `%s | ${name}` },
    description: s.tagline,
    icons: fav ? { icon: fav } : undefined,
    openGraph: { title: name, description: s.tagline, images: ["/brand/og-image.png"], type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#0A090C" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('ep_seen'))document.documentElement.dataset.seen='1'}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
