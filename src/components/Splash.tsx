"use client";
import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";

/** İlk girişte (oturum başına bir kez) oynayan açılış animasyonu. */
export function Splash() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (document.documentElement.dataset.seen) {
      setGone(true);
      return;
    }
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem("ep_seen", "1");
      } catch {}
      setGone(true);
    }, 1900);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div id="ep-splash" aria-hidden="true" className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-void">
      <div className="ep-splash-glow absolute h-[60vmin] w-[60vmin] rounded-full bg-ember/30 blur-[90px]" />
      <div className="relative flex flex-col items-center">
        <div className="ep-splash-mark">
          <LogoMark id="splash" className="h-24 w-24 drop-shadow-[0_0_40px_rgba(255,106,19,.6)]" />
        </div>
        <div className="mt-6 flex overflow-hidden font-display text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl">
          {"EpicPin".split("").map((ch, i) => (
            <span
              key={i}
              className={`ep-splash-letter ${i >= 4 ? "bg-gradient-to-b from-blaze to-ember bg-clip-text text-transparent" : "text-bone"}`}
              style={{ animationDelay: `${0.35 + i * 0.05}s` }}
            >
              {ch}
            </span>
          ))}
        </div>
        <div className="mt-7 h-[3px] w-44 overflow-hidden rounded-full bg-smoke">
          <div className="ep-splash-bar h-full origin-left bg-gradient-to-r from-blaze via-ember to-plasma" />
        </div>
      </div>
      <style>{`
        html[data-seen] #ep-splash{display:none}
        #ep-splash{animation:epOut .55s cubic-bezier(.7,0,.3,1) 1.35s forwards}
        .ep-splash-mark{animation:epMark .8s cubic-bezier(.2,1.4,.4,1) both}
        .ep-splash-letter{display:inline-block;animation:epUp .55s cubic-bezier(.2,.9,.3,1) both}
        .ep-splash-bar{animation:epBar 1.15s cubic-bezier(.6,0,.2,1) .15s both}
        .ep-splash-glow{animation:epGlow 1.4s ease-out both}
        @keyframes epMark{0%{transform:scale(.2) rotate(-60deg);opacity:0}100%{transform:none;opacity:1}}
        @keyframes epUp{0%{transform:translateY(110%);opacity:0}100%{transform:none;opacity:1}}
        @keyframes epBar{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}
        @keyframes epGlow{0%{transform:scale(.3);opacity:0}60%{opacity:1}100%{transform:scale(1.2);opacity:.6}}
        @keyframes epOut{to{clip-path:inset(0 0 100% 0)}}
      `}</style>
    </div>
  );
}
