"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    iFrameResize?: (opts: object, sel: string) => void;
  }
}

/** PayTR ödeme formunu iframe içinde gösterir; yüksekliği PayTR'nin script'iyle otomatik ayarlanır. */
export function PaytrFrame({ src, resizer }: { src: string; resizer: string }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const s = document.createElement("script");
    s.src = resizer;
    s.onload = () => {
      try {
        window.iFrameResize?.({}, "#paytriframe");
      } catch {}
    };
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, [resizer]);
  return (
    <div className="relative min-h-[560px]">
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center text-sm text-mute">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-ember" />
            Ödeme ekranı yükleniyor
          </div>
        </div>
      )}
      <iframe
        ref={ref}
        id="paytriframe"
        src={src}
        title="PayTR güvenli ödeme"
        onLoad={() => setLoaded(true)}
        className="relative w-full rounded-xl bg-white"
        style={{ minHeight: 560, border: 0 }}
        scrolling="no"
        allow="payment"
      />
    </div>
  );
}
