"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown, LayoutGrid, LogOut, Menu, Package, Search, ShoppingCart, User, Wallet, X, Heart, LifeBuoy, LayoutDashboard, Undo2,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { tl } from "@/lib/utils";
import { Icon } from "../Icon";
import { logoutAction } from "@/app/actions/auth";

type Cat = { name: string; slug: string; icon: string; color: string; count?: number };

export function SearchBox() {
  const router = useRouter();
  const sp = useSearchParams();
  const [v, setV] = useState(sp.get("q") ?? "");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/ilanlar${v.trim() ? `?q=${encodeURIComponent(v.trim())}` : ""}`);
      }}
      className="group relative w-full max-w-xl"
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute group-focus-within:text-ember" />
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Oyun, e-pin veya kod ara: Valorant, UC, Robux…"
        className="h-11 w-full rounded-xl border border-line bg-void/70 pl-10 pr-4 text-sm outline-none transition placeholder:text-mute/70 focus:border-ember focus:ring-2 focus:ring-ember/20"
        aria-label="Ara"
      />
    </form>
  );
}

export function CartButton() {
  const { count } = useCart();
  return (
    <Link href="/sepet" className="relative grid h-10 w-10 place-items-center rounded-xl text-mute transition hover:bg-smoke hover:text-bone" aria-label="Sepet">
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gradient-to-br from-blaze to-ember px-1 text-[10px] font-extrabold text-void">
          {count}
        </span>
      )}
    </Link>
  );
}

function useOutside(ref: React.RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [ref, close]);
}

export function UserMenu({ user }: { user: { username: string; role: string; balance: number } | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useOutside(ref, () => setOpen(false));
  useEffect(() => setOpen(false), [pathname]);

  if (!user)
    return (
      <div className="flex items-center gap-2">
        <Link href="/giris" className="btn-ghost hidden sm:inline-flex">
          Giriş yap
        </Link>
        <Link href="/kayit" className="btn-ember px-3 sm:px-4">
          Kayıt ol
        </Link>
      </div>
    );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-line bg-ash py-1 pl-1 pr-2 transition hover:border-ember/50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blaze to-plasma font-display text-sm font-extrabold text-void">
          {user.username.slice(0, 1).toUpperCase()}
        </span>
        <ChevronDown className={`h-4 w-4 text-mute transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-ash shadow-2xl shadow-black/60">
          <div className="border-b border-line p-4">
            <div className="font-display text-sm font-bold">{user.username}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-mute">
              Bakiye <span className="font-bold text-blaze">{tl(user.balance)}</span>
            </div>
          </div>
          <div className="p-1.5 text-sm">
            {user.role === "admin" && <MenuItem href="/admin" icon={<LayoutDashboard className="h-4 w-4 text-ember" />}>Yönetim paneli</MenuItem>}
            <MenuItem href="/hesabim" icon={<User className="h-4 w-4" />}>Hesabım</MenuItem>
            <MenuItem href="/hesabim/siparisler" icon={<Package className="h-4 w-4" />}>Siparişlerim</MenuItem>
            <MenuItem href="/hesabim/favoriler" icon={<Heart className="h-4 w-4" />}>Favorilerim</MenuItem>
            <MenuItem href="/hesabim/iadeler" icon={<Undo2 className="h-4 w-4" />}>İade taleplerim</MenuItem>
            <MenuItem href="/bakiye-yukle" icon={<Wallet className="h-4 w-4" />}>Bakiye yükle</MenuItem>
            <MenuItem href="/destek" icon={<LifeBuoy className="h-4 w-4" />}>Destek taleplerim</MenuItem>
            <form action={logoutAction}>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-plasma hover:bg-plasma/10">
                <LogOut className="h-4 w-4" /> Çıkış yap
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-bone/85 hover:bg-smoke hover:text-bone" role="menuitem">
      {icon}
      {children}
    </Link>
  );
}

export function CategoryMenu({ cats }: { cats: Cat[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useOutside(ref, () => setOpen(false));
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="relative" ref={ref} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${open ? "bg-ember text-void" : "text-bone hover:bg-smoke"}`}
        aria-expanded={open}
      >
        <LayoutGrid className="h-4 w-4" /> Kategoriler <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="grid w-[640px] grid-cols-3 gap-1 rounded-2xl border border-line bg-ash p-2 shadow-2xl shadow-black/60">
            {cats.map((c) => (
              <Link key={c.slug} href={`/kategori/${c.slug}`} className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-smoke">
                <span className="grid h-9 w-9 place-items-center rounded-lg transition group-hover:scale-110" style={{ background: `${c.color}22`, color: c.color }}>
                  <Icon name={c.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold">{c.name}</span>
                  <span className="text-xs text-mute">{c.count} ürün</span>
                </span>
              </Link>
            ))}
            <Link href="/kategoriler" className="col-span-3 mt-1 rounded-xl bg-smoke/60 py-2.5 text-center text-sm font-semibold text-blaze hover:bg-smoke">
              Tüm kategorileri gör
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileMenu({ cats, isAdmin, loggedIn }: { cats: Cat[]; isAdmin: boolean; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);
  return (
    <>
      <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl text-bone hover:bg-smoke md:hidden" aria-label="Menüyü aç">
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto border-r border-line bg-coal p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display font-bold">Menü</span>
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-smoke" aria-label="Kapat">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="grid gap-1 text-sm font-semibold">
              {isAdmin && <Link href="/admin" className="rounded-lg bg-ember/15 px-3 py-2.5 text-ember">Yönetim paneli</Link>}
              <Link href="/ilanlar" className="rounded-lg px-3 py-2.5 hover:bg-smoke">İlan pazarı</Link>
              <Link href="/ilanlar?sirala=indirim" className="rounded-lg px-3 py-2.5 hover:bg-smoke">Haftanın fırsatları</Link>
              <Link href="/bakiye-yukle" className="rounded-lg px-3 py-2.5 hover:bg-smoke">Bakiye yükle</Link>
              <Link href={loggedIn ? "/hesabim" : "/giris"} className="rounded-lg px-3 py-2.5 hover:bg-smoke">{loggedIn ? "Hesabım" : "Giriş yap"}</Link>
              <Link href="/blog" className="rounded-lg px-3 py-2.5 hover:bg-smoke">Blog</Link>
              <Link href="/duyurular" className="rounded-lg px-3 py-2.5 hover:bg-smoke">Duyurular</Link>
              <Link href="/destek" className="rounded-lg px-3 py-2.5 hover:bg-smoke">Destek</Link>
            </nav>
            <div className="mt-5 mb-2 px-3 text-xs font-semibold text-mute">Kategoriler</div>
            <div className="grid gap-1">
              {cats.map((c) => (
                <Link key={c.slug} href={`/kategori/${c.slug}`} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-smoke">
                  <Icon name={c.icon} className="h-4 w-4" style={{ color: c.color }} />
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
