import { requireUser } from "@/lib/auth";
import { tl } from "@/lib/utils";
import { AccountNav } from "@/components/site/AccountNav";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const u = await requireUser("/hesabim");
  return (
    <div className="container-ep mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="panel min-w-0 lg:sticky lg:top-24">
        <div className="flex items-center gap-3 border-b border-line p-5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blaze to-plasma font-display text-lg font-extrabold text-void">
            {u.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate font-display font-bold">{u.username}</div>
            <div className="text-sm text-blaze">{tl(u.balance)}</div>
          </div>
        </div>
        <AccountNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
