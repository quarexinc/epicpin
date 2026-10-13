import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { iframeUrl, PAYTR_BASE } from "@/lib/paytr";
import { tl } from "@/lib/utils";
import { PaytrFrame } from "@/components/site/PaytrFrame";

export const metadata = { title: "Kartla ödeme", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id) || 0;
  const u = await requireUser(`/odeme/kart/${id}`);
  const p = await one<any>("SELECT * FROM card_payments WHERE id = $1 AND user_id = $2", [id, u.id]);
  if (!p) notFound();
  if (p.status !== "pending" || !p.token) redirect(`/odeme/sonuc/${id}`);
  const expired = p.token_at && Date.now() - new Date(p.token_at).getTime() > 29 * 60 * 1000;
  return (
    <div className="container-ep py-8">
      <Link href={p.kind === "cart" ? "/sepet" : "/bakiye-yukle"} className="mb-4 inline-flex items-center gap-1.5 text-sm text-mute hover:text-bone">
        <ArrowLeft className="h-4 w-4" /> Geri dön
      </Link>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="panel overflow-hidden p-2 sm:p-4">
          {expired ? (
            <div className="grid place-items-center p-12 text-center">
              <h1 className="h-display text-2xl">Ödeme süresi doldu</h1>
              <p className="mt-2 text-sm text-mute">Güvenlik için ödeme ekranı 30 dakika açık kalır. Yeniden başlatabilirsin.</p>
              <Link href={p.kind === "cart" ? "/sepet" : "/bakiye-yukle"} className="btn-ember mt-5">Yeniden başlat</Link>
            </div>
          ) : (
            <PaytrFrame src={iframeUrl(p.token)} resizer={`${PAYTR_BASE}/js/iframeResizer.min.js`} />
          )}
        </div>
        <aside className="panel grid gap-4 p-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-ember/15 text-ember"><Lock className="h-5 w-5" /></span>
            <div>
              <div className="font-display font-bold">Güvenli ödeme</div>
              <div className="text-xs text-mute">PayTR altyapısı, 3D Secure</div>
            </div>
          </div>
          <dl className="grid gap-2 rounded-xl border border-line bg-coal p-4 text-sm">
            <div className="flex justify-between"><dt className="text-mute">{p.kind === "cart" ? "Sipariş ödemesi" : "Bakiye yükleme"}</dt><dd>{tl(p.amount)}</dd></div>
            {Number(p.charge) !== Number(p.amount) && <div className="flex justify-between"><dt className="text-mute">İşlem ücreti</dt><dd>{tl(Number(p.charge) - Number(p.amount))}</dd></div>}
            <div className="flex justify-between border-t border-line pt-2 font-bold"><dt>Karttan çekilecek</dt><dd className="font-display text-blaze">{tl(p.charge)}</dd></div>
          </dl>
          <p className="flex gap-2 text-xs text-mute"><ShieldCheck className="h-4 w-4 shrink-0 text-mint" /> Kart bilgilerin doğrudan PayTR&apos;ye iletilir, bizde saklanmaz. Ödeme onaylanınca {p.kind === "cart" ? "kodların otomatik teslim edilir" : "bakiyen anında yüklenir"}.</p>
          {p.test_mode && <p className="rounded-lg bg-blaze/15 p-2.5 text-xs font-semibold text-blaze">Test modu açık: gerçek para çekilmez.</p>}
        </aside>
      </div>
    </div>
  );
}
