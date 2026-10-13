"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { X, Wrench } from "lucide-react";
import { LogoMark } from "../Logo";

/** Yönetimden açılan kampanya penceresi; her yeni sürümde bir kez gösterilir. */
export function SitePopup({ version, title, text, link, button, image }: { version: string; title: string; text: string; link: string; button: string; image: string | null }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/giris") || path.startsWith("/kayit")) return;
    let seen = "";
    try {
      seen = localStorage.getItem("ep_popup") ?? "";
    } catch {}
    if (seen === version) return;
    const t = setTimeout(() => setOpen(true), 2200);
    return () => clearTimeout(t);
  }, [version, path]);
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem("ep_popup", version);
    } catch {}
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[96] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} style={{ animation: "fadeIn .3s" }} />
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-ember/40 bg-ash shadow-2xl" style={{ animation: "popIn .5s cubic-bezier(.2,1.3,.3,1)" }}>
        <button onClick={close} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-xl bg-black/50 text-bone hover:bg-black/70" aria-label="Kapat">
          <X className="h-5 w-5" />
        </button>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-48 w-full object-cover" />
        ) : (
          <div className="relative grid h-40 place-items-center bg-gradient-to-br from-ember/40 via-coal to-plasma/30">
            <div className="grid-bg absolute inset-0 opacity-70" />
            <LogoMark id="pop" className="h-20 w-20 drop-shadow-[0_0_30px_rgba(255,106,19,.7)]" />
          </div>
        )}
        <div className="p-6">
          <h2 className="h-display text-2xl leading-tight">{title}</h2>
          {text && <p className="mt-2 text-sm leading-6 text-bone/75">{text}</p>}
          <div className="mt-5 flex gap-2">
            {link && (
              <Link href={link} onClick={close} className="btn-ember flex-1 py-3">
                {button || "Göz at"}
              </Link>
            )}
            <button onClick={close} className="btn-ghost">Kapat</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}}@keyframes popIn{from{opacity:0;transform:translateY(30px) scale(.92)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

/** Bakım modu: yöneticiler dışında herkese bakım ekranı gösterir (giriş sayfası açık kalır). */
export function MaintenanceGate({ text }: { text: string }) {
  const path = usePathname();
  if (path.startsWith("/giris")) return null;
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center overflow-hidden bg-void p-6 text-center">
      <div className="absolute h-[60vmin] w-[60vmin] rounded-full bg-ember/20 blur-[100px]" />
      <div className="relative max-w-md">
        <LogoMark id="mt" className="mx-auto h-20 w-20 animate-floaty" />
        <div className="mx-auto mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-ember/15 text-ember">
          <Wrench className="h-6 w-6" />
        </div>
        <h1 className="h-display mt-4 text-3xl">Bakımdayız</h1>
        <p className="mt-3 text-bone/70">{text}</p>
        <Link href="/giris" className="mt-8 inline-block text-xs text-mute hover:text-bone">Yönetici girişi</Link>
      </div>
    </div>
  );
}
