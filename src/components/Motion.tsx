"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Sayfadaki tüm [data-reveal] öğelerini ekrana girdiklerinde görünür yapar. */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const scan = () => document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
  return null;
}

/** Fareyi takip eden 3B eğilme ve parlama. Dokunmatik cihazlarda kapalı. */
export function Tilt({ children, className = "", max = 9, glare = true }: { children: React.ReactNode; className?: string; max?: number; glare?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  return (
    <div
      ref={ref}
      className={`relative [transform-style:preserve-3d] transition-transform duration-300 ease-out will-change-transform ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || reduced()) return;
        const el = ref.current!;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
          el.style.transitionDuration = "80ms";
          el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateZ(0)`;
          el.style.setProperty("--mx", `${x * 100}%`);
          el.style.setProperty("--my", `${y * 100}%`);
          el.style.setProperty("--glare", "1");
        });
      }}
      onPointerLeave={() => {
        const el = ref.current!;
        cancelAnimationFrame(raf.current);
        el.style.transitionDuration = "500ms";
        el.style.transform = "";
        el.style.setProperty("--glare", "0");
      }}
    >
      {children}
      {glare && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
          style={{ opacity: "var(--glare, 0)", background: "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgba(255,178,36,.16), transparent 45%)" }}
        />
      )}
    </div>
  );
}

/** Sayfa geçişlerinde üstte ilerleyen ince çubuk; tıklamaya anında tepki verir. */
export function TopLoader() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http")) return;
      const next = new URL(href, location.href);
      if (next.pathname === location.pathname && next.search === location.search) return;
      setState("loading");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
    const t = setTimeout(() => setState("idle"), 450);
    return () => clearTimeout(t);
  }, [pathname, sp]);
  if (state === "idle") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[3px]">
      <div
        className="h-full origin-left bg-gradient-to-r from-blaze via-ember to-plasma shadow-[0_0_12px_#FF6A13]"
        style={
          state === "done"
            ? { transform: "scaleX(1)", opacity: 0, transition: "opacity .35s .1s" }
            : { animation: "ep-load 9s cubic-bezier(.08,.8,.2,1) forwards" }
        }
      />
      <style>{`@keyframes ep-load{from{transform:scaleX(0)}to{transform:scaleX(.92)}}`}</style>
    </div>
  );
}

/** Ekrana girince sıfırdan hedefe sayan rakam. */
export function CountUp({ to, suffix = "", className = "" }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current!;
    if (reduced()) {
      setV(to);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / 1400);
        setV(Math.round(to * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {v.toLocaleString("tr-TR")}
      {suffix}
    </span>
  );
}

/** Sayfa kayınca başlığa "kaydırıldı" durumu verir (gölge, küçülme). */
export function ScrollState() {
  useEffect(() => {
    const f = () => document.documentElement.toggleAttribute("data-scrolled", window.scrollY > 24);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return null;
}
