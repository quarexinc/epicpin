"use client";
import { useSyncExternalStore } from "react";

export type CartItem = { id: number; qty: number };
const KEY = "ep_cart";
const EVT = "ep-cart";
const EMPTY: CartItem[] = [];
let cacheRaw: string | null = null;
let cacheVal: CartItem[] = EMPTY;

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cacheRaw) return cacheVal;
    cacheRaw = raw;
    cacheVal = raw ? (JSON.parse(raw) as CartItem[]).filter((i) => i && i.id && i.qty > 0) : EMPTY;
    return cacheVal;
  } catch {
    return EMPTY;
  }
}

function write(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  window.dispatchEvent(new Event(EVT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items,
    count: items.reduce((a, b) => a + b.qty, 0),
    add(id: number, qty = 1) {
      const cur = read();
      const ex = cur.find((i) => i.id === id);
      write(ex ? cur.map((i) => (i.id === id ? { ...i, qty: Math.min(99, i.qty + qty) } : i)) : [...cur, { id, qty }]);
    },
    setQty(id: number, qty: number) {
      write(qty <= 0 ? read().filter((i) => i.id !== id) : read().map((i) => (i.id === id ? { ...i, qty: Math.min(99, qty) } : i)));
    },
    remove(id: number) {
      write(read().filter((i) => i.id !== id));
    },
    clear() {
      write([]);
    },
  };
}
