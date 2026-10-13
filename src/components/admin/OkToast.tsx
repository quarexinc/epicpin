"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";

export function OkToast() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const msg = sp.get("ok");
  const [show, setShow] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    setShow(msg);
    const p = new URLSearchParams(sp.toString());
    p.delete("ok");
    router.replace(`${path}${p.toString() ? `?${p}` : ""}`, { scroll: false });
    const t = setTimeout(() => setShow(null), 3500);
    return () => clearTimeout(t);
  }, [msg]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!show) return null;
  return (
    <div role="status" className="fixed bottom-6 right-6 z-[80] flex items-center gap-2 rounded-2xl border border-mint/30 bg-coal px-4 py-3 text-sm font-semibold text-mint shadow-2xl">
      <CircleCheck className="h-5 w-5" /> {show}
    </div>
  );
}
