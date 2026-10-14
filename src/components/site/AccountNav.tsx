"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, LifeBuoy, Package, Undo2, Wallet, Receipt, Settings } from "lucide-react";

const ITEMS = [
  ["/hesabim", "Genel bakış", LayoutDashboard],
  ["/hesabim/siparisler", "Siparişlerim", Package],
  ["/hesabim/favoriler", "Favorilerim", Heart],
  ["/hesabim/iadeler", "İade taleplerim", Undo2],
  ["/hesabim/bakiye", "Bakiye hareketleri", Receipt],
  ["/bakiye-yukle", "Bakiye yükle", Wallet],
  ["/destek", "Destek taleplerim", LifeBuoy],
  ["/hesabim/ayarlar", "Hesap ayarları", Settings],
] as const;

export function AccountNav() {
  const path = usePathname();
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto p-2 lg:grid">
      {ITEMS.map(([href, label, I]) => {
        const on = href === "/hesabim" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${on ? "bg-ember/15 text-ember" : "text-bone/80 hover:bg-smoke"}`}>
            <I className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
