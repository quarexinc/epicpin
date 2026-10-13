"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, ShoppingCart, Trash2, Wallet, Zap, CircleAlert, TicketPercent, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { tl } from "@/lib/utils";
import type { Listing } from "@/lib/data";
import { checkoutAction, getCartListings, previewCouponAction } from "@/app/actions/user";
import { ListingCover } from "./ListingCard";

export function CartView({ user }: { user: { balance: number } | null }) {
  const cart = useCart();
  const router = useRouter();
  const [data, setData] = useState<Record<number, Listing>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [cErr, setCErr] = useState("");
  const [cBusy, setCBusy] = useState(false);
  const ids = cart.items.map((i) => i.id).join(",");

  useEffect(() => {
    let ok = true;
    getCartListings(ids ? ids.split(",").map(Number) : []).then((rows) => {
      if (!ok) return;
      setData(Object.fromEntries(rows.map((r) => [r.id, r])));
      setLoaded(true);
    });
    return () => {
      ok = false;
    };
  }, [ids]);

  const lines = cart.items.filter((i) => data[i.id]).map((i) => ({ ...i, l: data[i.id] }));
  const missing = loaded ? cart.items.filter((i) => !data[i.id]) : [];
  useEffect(() => {
    if (missing.length) missing.forEach((m) => cart.remove(m.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing.length]);

  const sub = Math.round(lines.reduce((a, b) => a + b.l.price * b.qty, 0) * 100) / 100;
  const cartKey = cart.items.map((i) => `${i.id}:${i.qty}`).join(",");
  // Sepet değişince kupon indirimini yeniden hesapla
  useEffect(() => {
    if (!coupon) return;
    previewCouponAction(coupon.code, cart.items).then((r) => {
      if (r.ok) setCoupon({ code: r.code, discount: r.discount, label: r.label });
      else {
        setCoupon(null);
        setCErr(r.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]);
  const discount = coupon?.discount ?? 0;
  const total = Math.round((sub - discount) * 100) / 100;
  const saved = lines.reduce((a, b) => a + (b.l.old_price && b.l.old_price > b.l.price ? (b.l.old_price - b.l.price) * b.qty : 0), 0);
  const short = user ? Math.max(0, total - user.balance) : 0;

  if (!loaded && cart.items.length)
    return (
      <div className="container-ep grid place-items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-ember" />
      </div>
    );

  if (!lines.length)
    return (
      <div className="container-ep mt-8">
        <div className="panel grid place-items-center px-6 py-20 text-center">
          <ShoppingCart className="h-12 w-12 text-mute" />
          <div className="mt-4 font-display text-lg font-bold">Sepetin boş</div>
          <p className="mt-1 text-sm text-mute">Oyununu seç, paketini sepete ekle.</p>
          <Link href="/ilanlar" className="btn-ember mt-5">Ürünlere göz at</Link>
        </div>
      </div>
    );

  return (
    <div className="container-ep mt-8 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <div className="grid gap-3">
        {lines.map(({ id, qty, l }) => (
          <div key={id} className="panel flex items-center gap-4 p-3 sm:p-4">
            <Link href={`/ilan/${l.slug}`} className="group relative h-20 w-28 shrink-0 overflow-hidden rounded-xl">
              <ListingCover l={l} mini />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-mute">{l.category_name}</div>
              <Link href={`/ilan/${l.slug}`} className="line-clamp-1 font-bold hover:text-ember">{l.title}</Link>
              <div className="mt-1 text-sm">
                <span className="font-display font-bold text-blaze">{tl(l.price)}</span>
                {l.stock < qty && <span className="ml-2 text-xs text-plasma">Stok: {l.stock}</span>}
              </div>
            </div>
            <div className="flex items-center rounded-xl border border-line bg-coal">
              <button className="grid h-9 w-9 place-items-center text-mute hover:text-bone" onClick={() => cart.setQty(id, qty - 1)} aria-label="Azalt"><Minus className="h-3.5 w-3.5" /></button>
              <span className="w-7 text-center text-sm font-bold">{qty}</span>
              <button className="grid h-9 w-9 place-items-center text-mute hover:text-bone disabled:opacity-30" disabled={qty >= l.stock} onClick={() => cart.setQty(id, qty + 1)} aria-label="Arttır"><Plus className="h-3.5 w-3.5" /></button>
            </div>
            <div className="hidden w-28 text-right font-display font-bold sm:block">{tl(l.price * qty)}</div>
            <button onClick={() => cart.remove(id)} className="grid h-9 w-9 place-items-center rounded-lg text-mute hover:bg-plasma/15 hover:text-plasma" aria-label="Sepetten çıkar">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="panel sticky top-24 p-6">
        <div className="font-display text-lg font-bold">Sipariş özeti</div>
        <dl className="mt-4 grid gap-2.5 text-sm">
          <div className="flex justify-between"><dt className="text-mute">Ürünler ({cart.count})</dt><dd>{tl(sub + saved)}</dd></div>
          {saved > 0 && <div className="flex justify-between text-mint"><dt>Ürün indirimleri</dt><dd>-{tl(saved)}</dd></div>}
          {coupon && (
            <div className="flex justify-between text-mint">
              <dt className="flex items-center gap-1.5">
                Kupon {coupon.code}
                <button onClick={() => setCoupon(null)} className="text-mute hover:text-plasma" aria-label="Kuponu kaldır"><X className="h-3.5 w-3.5" /></button>
              </dt>
              <dd>-{tl(coupon.discount)}</dd>
            </div>
          )}
          <div className="perforation my-2" />
          <div className="flex items-end justify-between"><dt className="font-semibold">Toplam</dt><dd className="font-display text-2xl font-extrabold text-blaze">{tl(total)}</dd></div>
        </dl>

        {user && !coupon && (
          <form
            className="mt-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setCBusy(true);
              setCErr("");
              const r = await previewCouponAction(code, cart.items);
              setCBusy(false);
              if (r.ok) {
                setCoupon({ code: r.code, discount: r.discount, label: r.label });
                setCode("");
              } else setCErr(r.error);
            }}
          >
            <label className="label" htmlFor="coupon">İndirim kodu</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <TicketPercent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
                <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input pl-9 font-display text-xs font-bold uppercase tracking-wider" placeholder="EPIC10" />
              </div>
              <button disabled={cBusy || !code.trim()} className="btn-ghost px-4">{cBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Uygula"}</button>
            </div>
            {cErr && <p className="mt-1.5 text-xs text-plasma">{cErr}</p>}
          </form>
        )}
        {coupon && <p className="mt-3 rounded-xl border border-mint/30 bg-mint/10 px-3 py-2 text-xs font-semibold text-mint">{coupon.code} uygulandı: {coupon.label}</p>}

        {user && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-coal p-3 text-sm">
            <span className="flex items-center gap-2 text-mute"><Wallet className="h-4 w-4" /> Bakiyen</span>
            <span className="font-bold">{tl(user.balance)}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex gap-2 rounded-xl border border-plasma/30 bg-plasma/10 p-3 text-sm text-plasma">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {!user ? (
          <Link href="/giris?next=/sepet" className="btn-ember mt-5 h-12 w-full">Satın almak için giriş yap</Link>
        ) : short > 0 ? (
          <>
            <p className="mt-4 text-sm text-mute">Bu sipariş için <b className="text-bone">{tl(short)}</b> daha bakiye gerekiyor.</p>
            <Link href={`/bakiye-yukle?tutar=${Math.ceil(short)}`} className="btn-ember mt-3 h-12 w-full"><Wallet className="h-4 w-4" /> Bakiye yükle</Link>
          </>
        ) : (
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                setError("");
                const r = await checkoutAction(cart.items, coupon?.code);
                if (r.ok) {
                  cart.clear();
                  router.push(`/hesabim/siparisler/${r.orderId}?yeni=1`);
                  router.refresh();
                } else if (r.login) router.push("/giris?next=/sepet");
                else setError(r.error);
              })
            }
            className="btn-ember mt-5 h-12 w-full text-base"
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
            {pending ? "Sipariş oluşturuluyor" : "Bakiyemle öde"}
          </button>
        )}
        <p className="mt-3 text-center text-xs text-mute">Otomatik teslimatlı kodlar ödeme anında hesabına düşer.</p>
      </div>
    </div>
  );
}
