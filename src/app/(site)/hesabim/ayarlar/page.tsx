import { requireUser } from "@/lib/auth";
import { dateTR } from "@/lib/utils";
import { ChangeEmailForm, ChangePasswordForm } from "@/components/site/AccountForms";

export const metadata = { title: "Hesap ayarları" };

export default async function Page() {
  const u = await requireUser("/hesabim/ayarlar");
  return (
    <div className="grid gap-5">
      <div className="panel p-5 sm:p-6">
        <h1 className="font-display text-xl font-bold">Hesap ayarları</h1>
        <p className="mt-1 text-sm text-mute">Kullanıcı adın <b className="text-bone">{u.username}</b>, {dateTR(u.created_at)} tarihinden beri üyesin.</p>
      </div>
      <div className="panel p-5 sm:p-6">
        <h2 className="mb-4 font-display font-bold">Şifre</h2>
        <ChangePasswordForm />
      </div>
      <div className="panel p-5 sm:p-6">
        <h2 className="mb-4 font-display font-bold">E-posta</h2>
        <ChangeEmailForm email={u.email} />
      </div>
    </div>
  );
}
