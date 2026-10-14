import { AuthShell } from "@/components/site/AuthShell";
import { ForgotForm } from "@/components/site/AccountForms";

export const metadata = { title: "Şifremi unuttum" };

export default function Page() {
  return (
    <AuthShell title="Şifreni mi unuttun?" sub="E-posta adresini yaz, sana yeni şifre belirlemen için bir bağlantı gönderelim.">
      <ForgotForm />
    </AuthShell>
  );
}
