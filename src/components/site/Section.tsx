import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SectionHead({ title, sub, href, linkText = "Tümünü gör", extra }: { title: string; sub?: string; href?: string; linkText?: string; extra?: React.ReactNode }) {
  return (
    <div data-reveal className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="h-display text-2xl sm:text-[1.9rem]">
          {href ? (
            <Link href={href} className="group inline-flex items-center gap-2 transition hover:text-blaze">
              {title}
              <ChevronRight className="h-6 w-6 -translate-x-1 text-ember opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
            </Link>
          ) : (
            title
          )}
        </h2>
        {sub && <p className="mt-1.5 text-sm text-mute">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        {extra}
        {href && (
          <Link href={href} className="group inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 text-sm font-semibold text-bone/85 transition hover:border-ember hover:text-ember">
            {linkText}
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-line">
      <div className="grid-bg absolute inset-0 [mask-image:linear-gradient(180deg,#000,transparent)]" />
      <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-ember/20 blur-[100px]" />
      <div className="container-ep relative py-10 sm:py-14">
        <h1 className="h-display text-3xl sm:text-5xl" style={{ animation: "phIn .7s cubic-bezier(.2,.9,.2,1) both" }}>{title}</h1>
        <style>{`@keyframes phIn{from{opacity:0;transform:translateY(16px);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}`}</style>
        {sub && <p className="mt-3 max-w-2xl text-mute">{sub}</p>}
        {children}
      </div>
    </div>
  );
}
