import Link from "next/link";
import { q } from "@/lib/db";
import { dateTimeTR } from "@/lib/utils";
import { AdminTitle } from "@/components/admin/Fields";

export default async function Page({ searchParams }: { searchParams: Promise<{ sayfa?: string }> }) {
  const page = Math.max(1, Number((await searchParams).sayfa) || 1);
  const rows = await q<any>("SELECT * FROM admin_logs ORDER BY id DESC LIMIT 51 OFFSET $1", [(page - 1) * 50]);
  const more = rows.length > 50;
  return (
    <>
      <AdminTitle title="İşlem kayıtları" sub="Yöneticilerin panelde yaptığı her değişiklik burada listelenir." />
      <div className="panel divide-y divide-line">
        {rows.slice(0, 50).map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
            <span className="w-36 shrink-0 text-xs text-mute">{dateTimeTR(r.created_at)}</span>
            <Link href={r.admin_id ? `/admin/uyeler/${r.admin_id}` : "#"} className="font-semibold text-ember hover:underline">{r.admin_name}</Link>
            <span className="font-semibold">{r.action}</span>
            {r.detail && <span className="min-w-0 flex-1 truncate text-mute">{r.detail}</span>}
          </div>
        ))}
        {!rows.length && <p className="p-10 text-center text-sm text-mute">Henüz kayıt yok.</p>}
      </div>
      <div className="mt-4 flex gap-2">
        {page > 1 && <Link href={`/admin/kayitlar?sayfa=${page - 1}`} className="btn-ghost">Daha yeni</Link>}
        {more && <Link href={`/admin/kayitlar?sayfa=${page + 1}`} className="btn-ghost">Daha eski</Link>}
      </div>
    </>
  );
}
