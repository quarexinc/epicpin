"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** PayTR sonuç sayfası iframe içinde açılırsa tüm pencereye taşır. */
export function BreakOutOfFrame() {
  useEffect(() => {
    try {
      if (window.top && window.top !== window.self) window.top.location.href = window.location.href;
    } catch {}
  }, []);
  return null;
}

/** Ödeme onayı beklenirken sayfayı kısa aralıklarla yeniler (en fazla 2 dakika). */
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      if (++n > 48) return clearInterval(t);
      router.refresh();
    }, 2500);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
