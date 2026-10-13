"use client";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-ep grid place-items-center py-28 text-center">
      <div className="font-display text-6xl font-extrabold text-transparent [-webkit-text-stroke:2px_#FF6A13]">Ups</div>
      <h1 className="h-display mt-4 text-2xl">Bir şeyler ters gitti</h1>
      <p className="mt-2 max-w-md text-mute">Sayfa yüklenirken bir hata oluştu. Tekrar dene; sorun devam ederse destek ekibine yaz.</p>
      <div className="mt-6 flex gap-2">
        <button onClick={reset} className="btn-ember"><RotateCcw className="h-4 w-4" /> Tekrar dene</button>
        <Link href="/" className="btn-ghost">Ana sayfa</Link>
      </div>
    </div>
  );
}
