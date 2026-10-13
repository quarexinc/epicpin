"use client";
import { useEffect, useRef } from "react";
import { CreditCard } from "lucide-react";

/** Shopier'e gönderilecek imzalı formu oluşturur ve kısa bir beklemeden sonra otomatik gönderir. */
export function AutoSubmit({ action, fields }: { action: string; fields: Record<string, string> }) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.submit(), 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <form ref={ref} method="post" action={action} acceptCharset="UTF-8" className="mt-6">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className="btn-ember h-12 w-full text-base">
        <CreditCard className="h-5 w-5" /> Ödeme sayfasına git
      </button>
      <div className="mx-auto mt-4 h-1 w-40 overflow-hidden rounded-full bg-smoke">
        <div className="h-full origin-left bg-gradient-to-r from-blaze to-ember" style={{ animation: "goBar 1.2s linear forwards" }} />
      </div>
      <style>{`@keyframes goBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
    </form>
  );
}
