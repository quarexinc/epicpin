"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleCheck, ShoppingCart, X } from "lucide-react";

/** Sepete ekleme gibi işlemlerden sonra köşede beliren kısa bildirim. */
export function Toaster() {
  const [t, setT] = useState<{ id: number } | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const f = () => {
      setT({ id: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setT(null), 3200);
    };
    window.addEventListener("ep-toast", f);
    return () => {
      window.removeEventListener("ep-toast", f);
      clearTimeout(timer);
    };
  }, []);
  if (!t) return null;
  return (
    <div key={t.id} role="status" className="fixed bottom-24 left-1/2 z-[85] w-[min(92vw,380px)] -translate-x-1/2 sm:bottom-6 sm:left-6 sm:translate-x-0">
      <div style={{ animation: "toastIn .45s cubic-bezier(.2,1.2,.3,1)" }} className="flex items-center gap-3 rounded-2xl border border-mint/30 bg-coal/95 p-3 pl-4 shadow-2xl shadow-black/60 backdrop-blur">
        <CircleCheck className="h-5 w-5 shrink-0 text-mint" />
        <span className="flex-1 text-sm font-semibold">Sepete eklendi</span>
        <Link href="/sepet" className="btn-ember px-3 py-2 text-xs">
          <ShoppingCart className="h-3.5 w-3.5" /> Sepete git
        </Link>
        <button onClick={() => setT(null)} className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:bg-smoke" aria-label="Kapat">
          <X className="h-4 w-4" />
        </button>
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
