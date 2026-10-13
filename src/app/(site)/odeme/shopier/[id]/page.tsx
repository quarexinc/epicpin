import { notFound, redirect } from "next/navigation";
import { ShieldCheck, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { buildPaymentFields, SHOPIER_PAY_URL, shopierConfig } from "@/lib/shopier";
import { tl } from "@/lib/utils";
import { AutoSubmit } from "@/components/site/AutoSubmit";

export const metadata = { title: "Ödeme sayfasına yönlendiriliyorsun", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id) || 0;
  const u = await requireUser(`/odeme/shopier/${id}`);
  const p = await one<any>("SELECT * FROM shopier_payments WHERE id = $1 AND user_id = $2", [id, u.id]);
  if (!p) notFound();
  if (p.status !== "pending") redirect(`/odeme/sonuc/${id}`);
  const rows = await q<{ key: string; value: string }>("SELECT key, value FROM settings");
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const cfg = shopierConfig(s);
  if (!cfg) redirect(`/odeme/sonuc/${id}`);
  const site = s.site_name || "EpicPin";
  const fields = buildPaymentFields(cfg, {
    paymentId: p.id,
    randomNr: p.random_nr,
    charge: Number(p.charge),
    productName: p.kind === "deposit" ? `${site} bakiye yükleme` : `${site} sipariş`,
    buyer: {
      id: u.id,
      name: p.buyer_name,
      surname: p.buyer_surname,
      email: u.email,
      phone: p.buyer_phone,
      accountAgeDays: (Date.now() - new Date(u.created_at).getTime()) / 86400000,
    },
  });
  return (
    <div className="container-ep grid place-items-center py-20">
      <div className="panel w-full max-w-md p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ember/15 text-ember">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="h-display mt-5 text-2xl">Güvenli ödeme sayfasına geçiyorsun</h1>
        <p className="mt-2 text-sm text-mute">Kart bilgilerini Shopier&apos;in ödeme sayfasında gireceksin. Bilgilerin bizde saklanmaz.</p>
        <div className="mt-6 rounded-xl border border-line bg-coal p-4 text-left text-sm">
          <div className="flex justify-between"><span className="text-mute">Ödenecek tutar</span><b className="font-display text-blaze">{tl(p.charge)}</b></div>
          {Number(p.charge) !== Number(p.amount) && (
            <div className="mt-1 flex justify-between text-xs text-mute"><span>Bakiyene eklenecek</span><span>{tl(p.amount)}</span></div>
          )}
        </div>
        <AutoSubmit action={SHOPIER_PAY_URL} fields={fields} />
        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-mute"><ShieldCheck className="h-4 w-4 text-mint" /> 256-bit SSL ile korunan Shopier altyapısı</p>
      </div>
    </div>
  );
}
