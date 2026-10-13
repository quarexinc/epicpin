import Link from "next/link";
import { CircleCheck, CircleX, Hourglass, RotateCcw } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { tl } from "@/lib/utils";
import { ClearCart } from "@/components/site/ClearCart";
import { BreakOutOfFrame, AutoRefresh } from "@/components/site/PaymentHelpers";

export const metadata = { title: "Ödeme sonucu", robots: { index: false } };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ hata?: string }> }) {
  const id = Number((await params).id) || 0;
  const { hata } = await searchParams;
  const u = await requireUser(`/odeme/sonuc/${id}`);
  const p = await one<any>("SELECT * FROM card_payments WHERE id = $1 AND user_id = $2", [id, u.id]);

  const box = (icon: React.ReactNode, title: string, text: React.ReactNode, actions: React.ReactNode, tone: string) => (
    <div className="container-ep grid place-items-center py-20">
      <BreakOutOfFrame />
      <div className={`panel w-full max-w-md p-8 text-center ${tone}`} style={{ animation: "popIn .5s cubic-bezier(.2,1.3,.3,1)" }}>
        {icon}
        <h1 className="h-display mt-5 text-2xl">{title}</h1>
        <div className="mt-2 text-sm text-bone/75">{text}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>
      </div>
      <style>{`@keyframes popIn{from{opacity:0;transform:translateY(24px) scale(.95)}to{opacity:1;transform:none}}`}</style>
    </div>
  );

  if (!p)
    return box(
      <CircleX className="mx-auto h-14 w-14 text-plasma" />,
      "Ödeme bulunamadı",
      "Bu ödeme kaydı bulunamadı. Kartından para çekildiyse destek ekibine yaz.",
      <Link href="/destek" className="btn-ember">Destek al</Link>,
      "",
    );

  if (p.status === "paid") {
    if (p.kind === "cart" && p.order_id)
      return box(
        <CircleCheck className="mx-auto h-14 w-14 text-mint" />,
        "Ödeme alındı, siparişin hazır",
        "Kodların sipariş sayfanda seni bekliyor.",
        <>
          <ClearCart />
          <Link href={`/hesabim/siparisler/${p.order_id}?yeni=1`} className="btn-ember">Kodlarımı gör</Link>
        </>,
        "border-mint/30",
      );
    return box(
      <CircleCheck className="mx-auto h-14 w-14 text-mint" />,
      "Ödeme alındı",
      p.note ? <>{tl(p.amount)} bakiyene eklendi. {p.note}</> : <>{tl(p.amount)} bakiyene eklendi. Artık tek tıkla alışveriş yapabilirsin.</>,
      <>
        {p.kind === "cart" && <Link href="/sepet" className="btn-ember">Sepete dön</Link>}
        <Link href="/ilanlar" className={p.kind === "cart" ? "btn-ghost" : "btn-ember"}>Alışverişe başla</Link>
        <Link href="/hesabim/bakiye" className="btn-ghost">Bakiye hareketleri</Link>
      </>,
      "border-mint/30",
    );
  }

  if (p.status === "failed")
    return box(
      <CircleX className="mx-auto h-14 w-14 text-plasma" />,
      "Ödeme tamamlanmadı",
      <>
          {p.note || "Kartından çekim yapılmadı."} Tekrar deneyebilir ya da başka bir yöntem seçebilirsin.
      </>,
      <>
        <Link href={p.kind === "cart" ? "/sepet" : "/bakiye-yukle"} className="btn-ember"><RotateCcw className="h-4 w-4" /> Tekrar dene</Link>
        <Link href="/destek" className="btn-ghost">Destek al</Link>
      </>,
      "border-plasma/30",
    );

  return box(
    <Hourglass className="mx-auto h-14 w-14 animate-pulse text-blaze" />,
    hata ? "Ödeme tamamlanamadı gibi görünüyor" : "Ödemen onaylanıyor",
    <>
      <AutoRefresh />
      {hata
        ? "Kartından çekim yapıldıysa sonuç birkaç saniye içinde burada görünür. Çekim yapılmadıysa tekrar deneyebilirsin."
        : "Banka onayı birkaç saniye içinde gelir, bu sayfa kendiliğinden güncellenir. Kartından çekim yapıldı ama bakiyen gelmediyse destek ekibine yaz."}
    </>,
    <>
      <Link href={`/odeme/sonuc/${p.id}`} className="btn-ember"><RotateCcw className="h-4 w-4" /> Yenile</Link>
      {hata && <Link href={p.kind === "cart" ? "/sepet" : "/bakiye-yukle"} className="btn-ghost">Tekrar dene</Link>}
      <Link href="/destek" className="btn-ghost">Destek al</Link>
    </>,
    "",
  );
}
