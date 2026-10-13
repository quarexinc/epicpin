import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";

export const metadata = { title: "Bakiye hareketleri" };

export default async function Page() {
  const u = await requireUser("/hesabim/bakiye");
  const rows = await q<{ id: number; amount: number; description: string; created_at: string }>(
    "SELECT * FROM balance_logs WHERE user_id = $1 ORDER BY id DESC LIMIT 200",
    [u.id],
  );
  return (
    <div className="panel">
      <div className="flex items-center justify-between border-b border-line p-5">
        <h1 className="font-display text-xl font-bold">Bakiye hareketleri</h1>
        <Link href="/bakiye-yukle" className="btn-ember">Bakiye yükle</Link>
      </div>
      {rows.length ? (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-4 p-4 px-5 text-sm">
              <span className="flex-1">{r.description}</span>
              <span className="text-xs text-mute">{dateTimeTR(r.created_at)}</span>
              <span className={`w-28 text-right font-display font-bold ${r.amount >= 0 ? "text-mint" : "text-bone"}`}>
                {r.amount >= 0 ? "+" : ""}{tl(r.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-12 text-center text-sm text-mute">Henüz bakiye hareketin yok.</div>
      )}
    </div>
  );
}
