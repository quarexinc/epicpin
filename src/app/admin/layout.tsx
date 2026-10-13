import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { dbKind, one } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { OkToast } from "@/components/admin/OkToast";

export const metadata = { title: "Yönetim paneli", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  const c = await one<{ deposits: number; refunds: number; tickets: number; manual: number }>(`SELECT
    (SELECT COUNT(*)::int FROM deposits WHERE status = 'pending') AS deposits,
    (SELECT COUNT(*)::int FROM refund_requests WHERE status = 'pending') AS refunds,
    (SELECT COUNT(*)::int FROM tickets WHERE status IN ('open','customer_reply')) AS tickets,
    (SELECT COUNT(*)::int FROM order_items WHERE status = 'pending') AS manual`);
  const kind = await dbKind();
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminNav counts={c ?? {}} />
      <div className="min-w-0 flex-1">
        {kind === "pglite" && process.env.VERCEL && (
          <div className="border-b border-plasma/30 bg-plasma/10 px-6 py-3 text-sm text-plasma">
            Veritabanı bağlı değil: veriler geçici bellekte tutuluyor ve sıfırlanabilir. Vercel&apos;de DATABASE_URL ortam değişkenini ekle.
          </div>
        )}
        <div className="flex items-center justify-end gap-3 border-b border-line px-6 py-3 text-sm text-mute">
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
