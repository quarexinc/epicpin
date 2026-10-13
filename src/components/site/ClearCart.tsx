"use client";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** Kartla ödenen sipariş tamamlanınca sepeti boşaltır. */
export function ClearCart() {
  const cart = useCart();
  useEffect(() => {
    cart.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
