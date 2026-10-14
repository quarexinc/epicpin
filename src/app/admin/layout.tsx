import Link from "next/link";
import { Suspense } from "react";
import bcrypt from "bcryptjs";
import { TriangleAlert } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { one } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { OkToast } from "@/components/admin/OkToast";
import { Submit } from "@/components/FormBits";
import { cleanDemoAction } from "@/app/actions/admin";

export const metadata = { title: "Yönetim paneli", robots: { index: false } };

// Varsayılan şifre kontrolü pahalı (bcrypt); aynı şifre özeti için sonucu hatırla
const g = globalThis as unknown as { __epDefaultPw?: Map<string, boolean> };
async function usesDefaultPassword(hash: string) {
  g.__epDefaultPw ??= new Map();
  if (!g.__epDefaultPw.has(hash)) g.__epDefaultPw.set(hash, await bcrypt.compare("EpicPin2026!", hash));
  return g.__epDefaultPw.get(hash)!;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  const c = await one<{ deposits: number; refunds: number; tickets: number; manual: number; card: number; demo: number; hash: string }>(
    `SELECT
    (SELECT COUNT(*)::int FROM deposits WHERE status = 'pending') AS deposits,
    (SELECT COUNT(*)::int FROM refund_requests WHERE status = 'pending') AS refunds,
    (SELECT COUNT(*)::int FROM tickets WHERE status IN ('open','customer_reply')) AS tickets,
    (SELECT COUNT(*)::int FROM order_items WHERE status = 'pending') AS manual,
    (SELECT COUNT(*)::int FROM card_payments WHERE status = 'paid' AND kind = 'cart' AND order_id IS NULL) AS card,
    (SELECT COUNT(*)::int FROM users WHERE lower(email) = 'demo@epicpin.com' AND NOT banned) +
    (SELECT COUNT(*)::int FROM payment_methods WHERE active AND account_no IN ('TR00 0000 0000 0000 0000 0000 00', '1234567890')) AS demo,
    (SELECT password_hash FROM users WHERE id = $1) AS hash`,
    [me.id],
  );
  const defaultPw = c?.hash ? await usesDefaultPassword(c.hash) : false;
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminNav counts={c ? { deposits: c.deposits, refunds: c.refunds, tickets: c.tickets, manual: c.manual, card: c.card } : {}} />
      <div className="min-w-0 flex-1">
        {defaultPw && (
          <Link href={`/admin/uyeler/${me.id}`} className="flex items-center gap-2 border-b border-plasma/30 bg-plasma/15 px-4 py-3 text-sm font-semibold text-plasma sm:px-6">
            <TriangleAlert className="h-4 w-4 shrink-0" /> Yönetici hesabın hâlâ varsayılan şifreyi kullanıyor. Herkes bu şifreyi bilebilir: hemen değiştirmek için tıkla.
          </Link>
        )}
        {(c?.demo ?? 0) > 0 && (
          <form action={cleanDemoAction} className="flex flex-wrap items-center gap-3 border-b border-blaze/30 bg-blaze/10 px-4 py-3 text-sm text-blaze sm:px-6">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            <span className="flex-1">Kurulumla gelen örnek veriler duruyor (demo hesap, örnek IBAN, örnek kodlar). Canlıya almadan önce temizle.</span>
            <Submit className="btn-ghost px-3 py-1.5 text-xs">Örnek verileri temizle</Submit>
          </form>
        )}
        <div className="flex items-center justify-end gap-3 border-b border-line px-4 py-3 text-sm text-mute sm:px-6">
          Giriş yapan: <span className="font-semibold text-bone">{me.username}</span>
        </div>
        <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
      <Suspense>
        <OkToast />
      </Suspense>
    </div>
  );
}
