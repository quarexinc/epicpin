import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { dateTimeTR, tl } from "@/lib/utils";
import { PageHead } from "@/components/site/Section";
import { DepositForm } from "@/components/site/DepositForm";
import { StatusBadge } from "@/components/StatusBadge";
import { cardReady } from "@/lib/cardFlow";

export const metadata = { title: "Bakiye yükle" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tutar?: string }> }) {
  const u = await requireUser("/bakiye-yukle");
  const { tutar } = await searchParams;
  const [allMethods, deposits, cardOk] = await Promise.all([
    q<{ id: number; name: string; kind: string; account_name: string; account_no: string; instructions: string; commission: number; min_amount: number }>(
      "SELECT * FROM payment_methods WHERE active ORDER BY sort, id",
    ),
    q<{ id: number; method_name: string; amount: number; status: string; admin_note: string | null; created_at: string }>(
      "SELECT * FROM deposits WHERE user_id = $1 ORDER BY id DESC LIMIT 10",
      [u.id],
    ),
    cardReady(),
  ]);
  const methods = allMethods.filter((m) => m.kind !== "paytr" || cardOk);
  return (
    <>
      <PageHead title="Bakiye yükle" sub="Ödemeni yap, bildirimini gönder. Onaylandığı anda bakiyen hesabında." />
      <div className="container-ep mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <DepositForm methods={methods} initialAmount={tutar ? Number(tutar) : undefined} username={u.username} />
        <div className="grid gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-blaze to-ember p-5 text-void">
            <div className="text-sm font-semibold opacity-80">Mevcut bakiye</div>
            <div className="font-display text-3xl font-extrabold">{tl(u.balance)}</div>
          </div>
          <div className="panel">
            <div className="border-b border-line p-4 font-display text-sm font-bold">Son bildirimlerin</div>
            {deposits.length ? (
              <ul className="divide-y divide-line">
                {deposits.map((d) => (
                  <li key={d.id} className="p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-semibold">{d.method_name}</span>
                      <span className="font-display font-bold">{tl(d.amount)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusBadge status={d.status} />
                      <span className="text-xs text-mute">{dateTimeTR(d.created_at)}</span>
                    </div>
                    {d.admin_note && <p className="mt-1.5 text-xs text-mute">Not: {d.admin_note}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-mute">Henüz bildirim göndermedin.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
