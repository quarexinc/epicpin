import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSettings } from "@/lib/data";
import { img } from "@/lib/utils";
import { Suspense } from "react";
import { RevealObserver, ScrollState, TopLoader } from "@/components/Motion";
import { dbConfigured } from "@/lib/env";
import { SetupScreen } from "@/components/SetupScreen";

export async function generateMetadata(): Promise<Metadata> {
  const s = dbConfigured() ? await getSettings().catch(() => ({}) as Record<string, string>) : ({} as Record<string, string>);
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

export const viewport: Viewport = { themeColor: "#0A090C", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('ep_seen'))document.documentElement.dataset.seen='1'}catch(e){}`,
          }}
        />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}#ep-splash{display:none}`}</style>
        </noscript>
      </head>
      <body>
        <Suspense>
          <TopLoader />
        </Suspense>
        <RevealObserver />
        <ScrollState />
        {dbConfigured() ? children : <SetupScreen />}
      </body>
    </html>
  );
}
