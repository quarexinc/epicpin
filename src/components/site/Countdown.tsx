"use client";
import { useEffect, useState } from "react";

function nextSundayEnd() {
  const d = new Date();
  const end = new Date(d);
  end.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  end.setHours(23, 59, 59, 0);
  if (end <= d) end.setDate(end.getDate() + 7);
  return end;
}

export function Countdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const end = nextSundayEnd();
    const f = () => setLeft(Math.max(0, end.getTime() - Date.now()));
    f();
    const t = setInterval(f, 1000);
    return () => clearInterval(t);
  }, []);
  const parts = left == null ? ["--", "--", "--", "--"] : [86400000, 3600000, 60000, 1000].map((u, i, a) => String(Math.floor((left % (a[i - 1] ?? Infinity)) / u)).padStart(2, "0"));
  return (
    <div className="flex items-center gap-1.5" aria-label="Fırsatların bitmesine kalan süre">
      {parts.map((p, i) => (
        <span key={i} className="flex items-baseline gap-0.5">
          <span className="min-w-[2.4rem] rounded-lg border border-ember/30 bg-ember/10 px-1.5 py-1 text-center font-display text-sm font-bold tabular-nums text-blaze">{p}</span>
          <span className="text-[10px] text-mute">{["g", "s", "d", "sn"][i]}</span>
        </span>
      ))}
    </div>
  );
}
