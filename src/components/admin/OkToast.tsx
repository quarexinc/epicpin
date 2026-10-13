"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";

export function OkToast() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const msg = sp.get("ok") || sp.get("err");
  const isErr = !sp.get("ok") && !!sp.get("err");
  const [show, setShow] = useState<{ m: string; err: boolean } | null>(null);
  useEffect(() => {
    if (!msg) return;
    setShow({ m: msg, err: isErr });
    const p = new URLSearchParams(sp.toString());
    p.delete("ok");
    p.delete("err");
    router.replace(`${path}${p.toString() ? `?${p}` : ""}`, { scroll: false });
    const t = setTimeout(() => setShow(null), 3500);
    return () => clearTimeout(t);
  }, [msg]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!show) return null;
  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-[80] flex items-center gap-2 rounded-2xl border bg-coal px-4 py-3 text-sm font-semibold shadow-2xl ${show.err ? "border-plasma/40 text-plasma" : "border-mint/30 text-mint"}`}
      style={{ animation: "toastIn .45s cubic-bezier(.2,1.2,.3,1)" }}
    >
      {show.err ? <CircleAlert className="h-5 w-5" /> : <CircleCheck className="h-5 w-5" />} {show.m}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
