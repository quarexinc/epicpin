"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Zap } from "lucide-react";
import { useCart } from "@/lib/cart";
import { tl } from "@/lib/utils";
import { AddToCartButton, FavoriteButton } from "./ListingActions";

export function BuyBox({ id, price, stock, fav }: { id: number; price: number; stock: number; fav: boolean }) {
  const [qty, setQty] = useState(1);
  const cart = useCart();
  const router = useRouter();
  const out = stock <= 0;
  const max = Math.min(stock, 99);
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center rounded-xl border border-line bg-coal">
          <button className="grid h-12 w-12 place-items-center text-mute hover:text-bone disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Azalt">
            <Minus className="h-4 w-4" />
          </button>
          <input
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(max || 1, Number(e.target.value.replace(/\D/g, "")) || 1)))}
            className="w-12 bg-transparent text-center font-display font-bold outline-none"
            aria-label="Adet"
            inputMode="numeric"
          />
          <button className="grid h-12 w-12 place-items-center text-mute hover:text-bone disabled:opacity-30" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label="Arttır">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="text-right">
          <div className="text-xs text-mute">Toplam</div>
          <div className="font-display text-xl font-extrabold">{tl(price * qty)}</div>
        </div>
      </div>
      <button
        disabled={out}
        onClick={() => {
          cart.add(id, qty);
          router.push("/sepet");
        }}
        className="btn-ember mt-4 h-14 w-full text-base"
      >
        <Zap className="h-5 w-5" /> {out ? "Stokta yok" : "Hemen satın al"}
      </button>
      <div className="mt-2.5 flex gap-2.5">
        <div className="flex-1">
          <AddToCartButton id={id} qty={qty} disabled={out} big />
        </div>
        <FavoriteButton id={id} initial={fav} withLabel />
      </div>
    </div>
  );
}
