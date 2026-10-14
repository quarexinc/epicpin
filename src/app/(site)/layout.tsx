import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Splash } from "@/components/Splash";
import { Toaster } from "@/components/site/Toaster";
import { MaintenanceGate, SitePopup } from "@/components/site/SiteOverlays";
import { getSettings } from "@/lib/data";
import { getUser } from "@/lib/auth";
import { img } from "@/lib/utils";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, user] = await Promise.all([getSettings(), getUser()]);
  const maintenance = s.maintenance_on === "on" && user?.role !== "admin";
  return (
    <>
      {!maintenance && <Splash />}
      {maintenance && <MaintenanceGate text={s.maintenance_text || "Kısa bir bakım çalışması yapıyoruz."} />}
      {user?.role === "admin" && s.maintenance_on === "on" && (
        <Link href="/admin/ayarlar" className="block bg-plasma py-2 text-center text-xs font-bold text-white">
          Bakım modu açık: ziyaretçiler siteyi göremiyor. Kapatmak için tıkla.
        </Link>
      )}
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <Toaster />
      {!maintenance && s.popup_on === "on" && s.popup_title && (
        <SitePopup
          version={s.popup_version || "1"}
          title={s.popup_title}
          text={s.popup_text}
          link={s.popup_link}
          button={s.popup_button}
          image={img(s.popup_image_id)}
        />
      )}
      {s.whatsapp && (
        <a
          href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="ep-float-wa fixed bottom-[88px] right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110"
          aria-label="WhatsApp destek"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3ZM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8ZM12 0a12 12 0 0 0-10.3 18L0 24l6.2-1.6A12 12 0 1 0 12 0Z"/></svg>
        </a>
      )}
      <Link
        href="/destek"
        className="ep-float group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-blaze to-ember pl-4 pr-4 font-bold text-void shadow-ember transition-all hover:scale-105 hover:pr-5"
        aria-label="Canlı destek"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-ember/40 [animation-duration:2.4s]" />
        <MessageCircle className="h-6 w-6 transition group-hover:rotate-12" />
        <span className="hidden text-sm sm:inline">Destek</span>
      </Link>
    </>
  );
}
