"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toggleFavoriteAction } from "@/app/actions/user";

export function AddToCartButton({ id, disabled, qty = 1, big = false }: { id: number; disabled?: boolean; qty?: number; big?: boolean }) {
  const cart = useCart();
  const [done, setDone] = useState(false);
  return (
    <button
      disabled={disabled}
      onClick={() => {
        cart.add(id, qty);
        window.dispatchEvent(new CustomEvent("ep-toast", { detail: { kind: "cart" } }));
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      className={`${big ? "btn-ghost h-12 w-full text-base" : "btn w-full border border-line bg-smoke/70 py-2 text-[13px] text-bone hover:border-ember hover:bg-ember hover:text-void"}`}
    >
      {done ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
      {disabled ? "Stokta yok" : done ? "Sepete eklendi" : "Sepete ekle"}
    </button>
  );
}

export function FavoriteButton({ id, initial, className = "", withLabel = false }: { id: number; initial: boolean; className?: string; withLabel?: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      aria-label={on ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={on}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleFavoriteAction(id);
          if (r === "login") router.push(`/giris?next=${encodeURIComponent(location.pathname)}`);
          else setOn(r === "added");
        })
      }
      className={`${className} ${withLabel ? "btn-ghost h-12 px-4" : "grid h-9 w-9 place-items-center rounded-xl bg-black/50 backdrop-blur"} transition hover:scale-110 ${on ? "text-plasma" : "text-bone"}`}
    >
      <Heart className={`h-[18px] w-[18px] ${on ? "fill-plasma" : ""}`} />
      {withLabel && (on ? "Favorilerde" : "Favorile")}
    </button>
  );
}
