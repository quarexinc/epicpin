"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BannerArt, THEMES } from "./BannerArt";

type B = { id: number; title: string; subtitle: string; cta_text: string; cta_link: string; label: string; theme: string; image: string | null };

const DURATION = 6000;

export function HeroSlider({ banners }: { banners: B[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const touch = useRef<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const n = banners.length;

  const go = useCallback(
    (i: number) => {
      setActive(((i % n) + n) % n);
      setTick((t) => t + 1);
    },
    [n],
  );

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setTimeout(() => go(active + 1), DURATION);
    return () => clearTimeout(t);
  }, [active, paused, go, n, tick]);

  if (!n) return null;

  return (
    <section
      ref={root}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = root.current!.getBoundingClientRect();
        root.current!.style.setProperty("--px", `${((e.clientX - r.left) / r.width - 0.5).toFixed(3)}`);
        root.current!.style.setProperty("--py", `${((e.clientY - r.top) / r.height - 0.5).toFixed(3)}`);
      }}
      aria-roledescription="carousel"
      aria-label="Kampanyalar"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      <div className="flex h-[420px] gap-2 sm:h-[440px] lg:gap-3">
        {banners.map((b, i) => {
          const on = i === active;
          const t = THEMES[b.theme] ?? THEMES.ember;
          return (
            <div
              key={b.id}
              onClick={() => !on && go(i)}
              onKeyDown={(e) => !on && (e.key === "Enter" || e.key === " ") && go(i)}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${n}: ${b.title}`}
              tabIndex={on ? -1 : 0}
              className={`group relative overflow-hidden rounded-[28px] border transition-[flex-grow,border-color] duration-700 ease-[cubic-bezier(.7,0,.2,1)] ${
                on ? "grow-[7] border-white/10" : "hidden cursor-pointer grow border-line hover:border-white/20 lg:block"
              } ${on ? "basis-0" : "basis-0 min-w-[84px]"}`}
              style={{ background: `radial-gradient(120% 90% at 85% 40%, ${t.b}40, transparent 60%), ${t.bg}` }}
            >
              {/* arka plan */}
              {b.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.image}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out ${on ? "scale-105" : "scale-125"}`}
                  style={on ? { transform: "scale(1.08) translate3d(calc(var(--px,0) * -18px), calc(var(--py,0) * -12px), 0)" } : undefined}
                  fetchPriority={i === 0 ? "high" : "low"}
                />
              ) : (
                <>
                  <div className="grid-bg absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_80%_at_70%_50%,#000,transparent)]" />
                  <div
                    className="absolute inset-0 transition-transform duration-300 ease-out"
                    style={{ transform: on ? "translate3d(calc(var(--px,0) * -36px), calc(var(--py,0) * -26px), 0)" : undefined }}
                  >
                    <BannerArt
                      theme={b.theme}
                      seed={b.id}
                      className={`absolute right-[-6%] top-1/2 h-[118%] w-auto -translate-y-1/2 transition duration-700 ${on ? "scale-100 opacity-100" : "scale-90 opacity-40 blur-[1px]"}`}
                    />
                  </div>
                </>
              )}
              <div className={`absolute inset-0 transition duration-700 ${on ? "bg-gradient-to-t from-black/90 via-black/55 to-black/10 sm:bg-gradient-to-r sm:from-black/85 sm:via-black/45 sm:to-transparent" : "bg-black/55 group-hover:bg-black/40"}`} />

              {/* açık panelin tamamı tıklanabilir */}
              {on && <Link href={b.cta_link || "/ilanlar"} className="absolute inset-0 z-[1]" aria-label={b.title} tabIndex={-1} />}

              {/* kapalı panel başlığı */}
              <div className={`absolute inset-0 flex flex-col items-center justify-end pb-6 transition-opacity duration-300 ${on ? "pointer-events-none opacity-0" : "opacity-100 delay-300"}`}>
                <span className="font-display text-sm font-bold text-bone/90 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap max-h-[300px] overflow-hidden text-ellipsis">
                  {b.label || b.title}
                </span>
                <span className="mt-4 h-2.5 w-2.5 rounded-full" style={{ background: t.b, boxShadow: `0 0 16px ${t.b}` }} />
              </div>

              {/* açık panel içeriği */}
              <div
                className={`pointer-events-none relative z-[2] flex h-full max-w-[620px] flex-col justify-end p-6 sm:p-10 transition-all duration-500 ${
                  on ? "translate-y-0 opacity-100 delay-300" : "translate-y-6 opacity-0"
                }`}
              >
                {b.label && (
                  <span
                    className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-void"
                    style={{ background: `linear-gradient(90deg, ${t.a}, ${t.b})` }}
                  >
                    {b.label}
                  </span>
                )}
                <h2 key={on ? `on${tick}` : "off"} className="h-display text-balance text-[2rem] leading-[1.05] sm:text-5xl">
                  {b.title.split(" ").map((w, k) => (
                    <span key={k} className="inline-block overflow-hidden pb-1 align-bottom">
                      <span className="inline-block" style={on ? { animation: `heroWord .7s cubic-bezier(.2,.9,.2,1) ${0.25 + k * 0.06}s both` } : undefined}>
                        {w}&nbsp;
                      </span>
                    </span>
                  ))}
                </h2>
                {b.subtitle && <p className="mt-4 max-w-md text-[15px] leading-6 text-bone/75">{b.subtitle}</p>}
                <div className="mt-7 flex items-center gap-3">
                  <Link
                    href={b.cta_link || "/ilanlar"}
                    tabIndex={on ? 0 : -1}
                    className="btn-ember pointer-events-auto px-6 py-3"
                    style={{ background: `linear-gradient(135deg, ${t.a}, ${t.b})` }}
                  >
                    {b.cta_text || "Hemen al"}
                  </Link>
                </div>
              </div>

              {/* ilerleme çubuğu */}
              {on && n > 1 && (
                <div className="absolute inset-x-6 bottom-0 z-[2] h-[3px] overflow-hidden rounded-full bg-white/10 sm:inset-x-10">
                  <div
                    key={tick}
                    className="h-full origin-left"
                    style={{
                      background: `linear-gradient(90deg, ${t.a}, ${t.b})`,
                      animation: `progress ${DURATION}ms linear forwards`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => go(i)}
                aria-label={`${i + 1}. kampanyaya git`}
                className={`h-2 rounded-full transition-all ${i === active ? "w-8 bg-ember" : "w-2 bg-line hover:bg-mute"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => go(active - 1)} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-ash text-mute hover:border-ember hover:text-ember" aria-label="Önceki">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => go(active + 1)} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-ash text-mute hover:border-ember hover:text-ember" aria-label="Sonraki">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes heroWord{from{transform:translateY(105%) rotate(4deg)}to{transform:none}}`}</style>
    </section>
  );
}
