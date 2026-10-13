import Link from "next/link";
import { ShieldCheck, Zap, Headphones, Lock } from "lucide-react";
import { getCategories, getSettings } from "@/lib/data";
import { img } from "@/lib/utils";
import { Logo } from "../Logo";

const Social = ({ href, label, d }: { href?: string; label: string; d: string }) =>
  href ? (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-ash text-mute transition hover:border-ember hover:text-ember">
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor"><path d={d} /></svg>
    </a>
  ) : null;

export async function Footer() {
  const [s, cats] = await Promise.all([getSettings(), getCategories()]);
  return (
    <footer className="mt-24 border-t border-line bg-coal">
      <div className="container-ep grid gap-4 border-b border-line py-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Zap, "Anında teslimat", "Kodlar ödeme sonrası saniyeler içinde hesabında."],
          [ShieldCheck, "Orijinal kodlar", "Tüm ürünler yetkili dağıtıcılardan gelir."],
          [Lock, "Güvenli ödeme", "Kart bilgin bizde saklanmaz, bakiyenle öde."],
          [Headphones, "7/24 destek", "Sorun mu var? Destek talebi aç, hemen dönelim."],
        ].map(([I, t, d]: any) => (
          <div key={t} className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ember/10 text-ember">
              <I className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-sm font-bold">{t}</div>
              <div className="mt-0.5 text-sm text-mute">{d}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="container-ep grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo logoUrl={img(s.logo_image_id)} />
          <p className="mt-4 max-w-sm text-sm leading-6 text-mute">{s.footer_about}</p>
          <div className="mt-5 flex gap-2">
            <Social href={s.instagram} label="Instagram" d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2Zm0 4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8Zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.1-9.4a1.1 1.1 0 1 0 0 2.3 1.1 1.1 0 0 0 0-2.3Z" />
            <Social href={s.discord} label="Discord" d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.5 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18a19.9 19.9 0 0 0 6 3l1.3-2.1a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1L18 21a19.8 19.8 0 0 0 6-3c.5-5.1-.8-9.6-3.7-13.6ZM8 15.3c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
            <Social href={s.x} label="X" d="M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.9 2.3h7l4.8 6.4 5.5-6.4Zm-1.2 17.9h1.9L7 4.2H5l12 16Z" />
            <Social href={s.youtube} label="YouTube" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
          </div>
        </div>
        <FooterCol title="Kategoriler" links={cats.slice(0, 6).map((c) => [c.name, `/kategori/${c.slug}`])} />
        <FooterCol title="Alışveriş" links={[["İlan pazarı", "/ilanlar"], ["Haftanın fırsatları", "/ilanlar?sirala=indirim"], ["Sepetim", "/sepet"], ["Bakiye yükle", "/bakiye-yukle"], ["Tüm kategoriler", "/kategoriler"]]} />
        <FooterCol title="Yardım" links={[["Destek merkezi", "/destek"], ["Siparişlerim", "/hesabim/siparisler"], ["İade talepleri", "/hesabim/iadeler"], ["Duyurular", "/duyurular"], ["Blog", "/blog"]]} />
      </div>
      <div className="border-t border-line">
        <div className="container-ep flex flex-col items-center justify-between gap-2 py-5 text-xs text-mute sm:flex-row">
          <span>© {new Date().getFullYear()} {s.site_name || "EpicPin"}. Tüm hakları saklıdır.</span>
          <span>Oyun adları ve markaları sahiplerine aittir. {s.contact_email && <a className="hover:text-bone" href={`mailto:${s.contact_email}`}>{s.contact_email}</a>}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <div className="mb-4 font-display text-sm font-bold">{title}</div>
      <ul className="grid gap-2.5 text-sm text-mute">
        {links.map(([l, h]) => (
          <li key={h}>
            <Link href={h} className="hover:text-ember">{l}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
