import Link from "next/link";
import { Search, UserPlus, ShieldCheck, Ban } from "lucide-react";
import { q } from "@/lib/db";
import { dateTR, tl } from "@/lib/utils";
import { createUser } from "@/app/actions/admin";
import { AdminTitle, Card, Field } from "@/components/admin/Fields";
import { AForm } from "@/components/admin/AForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; rol?: string; yeni?: string }> }) {
  const sp = await searchParams;
  const params: unknown[] = [];
  const where: string[] = [];
  if (sp.q) {
    params.push(`%${sp.q}%`);
    where.push(`(u.username ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }
  if (sp.rol === "admin") where.push("u.role = 'admin'");
  const rows = await q<any>(
    `SELECT u.*, (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS orders FROM users u ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY u.id DESC LIMIT 200`,
    params,
  );
  return (
    <>
      <AdminTitle title="Üyeler" sub="Üye ve yönetici hesapları.">
        <Link href="/admin/uyeler?yeni=1" className="btn-ember"><UserPlus className="h-4 w-4" /> Üye / yönetici ekle</Link>
      </AdminTitle>
      {sp.yeni && (
        <Card title="Yeni hesap" className="mb-5">
          <AForm action={createUser} submit="Hesabı oluştur">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Kullanıcı adı"><input name="username" className="input" required /></Field>
              <Field label="E-posta"><input name="email" type="email" className="input" required /></Field>
              <Field label="Şifre"><input name="password" type="text" className="input" required minLength={6} /></Field>
              <Field label="Yetki">
                <select name="role" className="input" defaultValue="user">
                  <option value="user">Üye</option>
                  <option value="admin">Yönetici</option>
                </select>
              </Field>
              <Field label="Başlangıç bakiyesi ₺"><input name="balance" inputMode="decimal" className="input" defaultValue="0" /></Field>
            </div>
          </AForm>
        </Card>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
          <input name="q" defaultValue={sp.q} placeholder="Kullanıcı adı veya e-posta" className="input pl-9" />
        </form>
        <Link href="/admin/uyeler" className={`chip ${sp.rol ? "" : "border-ember text-ember"}`}>Tümü</Link>
        <Link href="/admin/uyeler?rol=admin" className={`chip ${sp.rol === "admin" ? "border-ember text-ember" : ""}`}>Yöneticiler</Link>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="text-left text-xs text-mute">
            <tr className="border-b border-line">
              <th className="p-3 pl-4 font-semibold">Kullanıcı</th>
              <th className="p-3 font-semibold">Bakiye</th>
              <th className="p-3 font-semibold">Sipariş</th>
              <th className="p-3 font-semibold">Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-smoke/40">
                <td className="p-3 pl-4">
                  <Link href={`/admin/uyeler/${u.id}`} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-smoke font-display text-sm font-bold">{u.username[0].toUpperCase()}</span>
                    <span>
                      <span className="flex items-center gap-1.5 font-semibold hover:text-ember">
                        {u.username}
                        {u.role === "admin" && <ShieldCheck className="h-4 w-4 text-ember" />}
                        {u.banned && <Ban className="h-4 w-4 text-plasma" />}
                      </span>
                      <span className="text-xs text-mute">{u.email}</span>
                    </span>
                  </Link>
                </td>
                <td className="p-3 font-display font-bold">{tl(u.balance)}</td>
                <td className="p-3">{u.orders}</td>
                <td className="p-3 text-mute">{dateTR(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
