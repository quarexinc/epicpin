"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, Store, Folder, PanelsTopLeft, Megaphone, Newspaper, Users, Wallet, Undo2, LifeBuoy, CreditCard, Settings, Menu, X, ExternalLink,
  TicketPercent, CircleHelp, History, ShoppingBag,
} from "lucide-react";
import { Logo } from "../Logo";

const GROUPS: [string, [string, string, any, string?][]][] = [
  ["Genel", [["/admin", "Panel", LayoutDashboard], ["/admin/siparisler", "Siparişler", Package, "manual"]]],
  ["Mağaza", [["/admin/ilanlar", "İlanlar", Store], ["/admin/kategoriler", "Kategoriler", Folder], ["/admin/bannerlar", "Bannerlar", PanelsTopLeft], ["/admin/kuponlar", "Kuponlar", TicketPercent]]],
  ["İçerik", [["/admin/duyurular", "Duyurular", Megaphone], ["/admin/blog", "Blog", Newspaper], ["/admin/sss", "Sık sorulanlar", CircleHelp]]],
  ["Müşteriler", [["/admin/uyeler", "Üyeler", Users], ["/admin/bakiye", "Bakiye talepleri", Wallet, "deposits"], ["/admin/iadeler", "İade talepleri", Undo2, "refunds"], ["/admin/destek", "Destek", LifeBuoy, "tickets"]]],
  ["Ayarlar", [["/admin/paytr", "PayTR ve e-posta", ShoppingBag, "card"], ["/admin/odeme", "Ödeme yöntemleri", CreditCard], ["/admin/ayarlar", "Site ayarları", Settings], ["/admin/kayitlar", "İşlem kayıtları", History]]],
];

export function AdminNav({ counts }: { counts: Record<string, number> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const nav = (
    <nav className="grid gap-5">
      {GROUPS.map(([g, items]) => (
        <div key={g}>
          <div className="mb-1.5 px-3 text-[11px] font-semibold text-mute/80">{g}</div>
          <div className="grid gap-0.5">
            {items.map(([href, label, I, ck]) => {
              const on = href === "/admin" ? path === href : path.startsWith(href);
              const c = ck ? counts[ck] : 0;
              return (
                <Link key={href} href={href} className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${on ? "bg-ember text-void" : "text-bone/80 hover:translate-x-1 hover:bg-smoke"}`}>
                  <I className="h-4 w-4 transition group-hover:scale-110" />
                  <span className="flex-1">{label}</span>
                  {c > 0 && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${on ? "bg-void text-ember" : "bg-plasma text-white"}`}>{c}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <Link href="/" className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-mute hover:text-bone">
        <ExternalLink className="h-4 w-4" /> Siteye git
      </Link>
    </nav>
  );
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-line bg-coal p-4 lg:block">
        <Link href="/admin" className="mb-6 block px-2 pt-1"><Logo size="sm" /></Link>
        {nav}
      </aside>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-coal/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo size="sm" />
        <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-smoke" aria-label="Menü"><Menu className="h-5 w-5" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-coal p-4">
            <button onClick={() => setOpen(false)} className="mb-4 ml-auto grid h-9 w-9 place-items-center rounded-lg hover:bg-smoke" aria-label="Kapat"><X className="h-5 w-5" /></button>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
