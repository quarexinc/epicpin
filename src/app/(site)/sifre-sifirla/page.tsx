import Link from "next/link";
import { AuthShell } from "@/components/site/AuthShell";
import { ResetForm } from "@/components/site/AccountForms";

export const metadata = { title: "Yeni şifre belirle", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return (
    <AuthShell title="Yeni şifre belirle" sub="Yeni şifreni iki kez yaz. Kaydettiğinde diğer cihazlardaki oturumların kapanır.">
      {t ? (
        <ResetForm token={t} />
      ) : (
        <p className="text-sm text-mute">
          Bağlantı eksik. <Link href="/sifremi-unuttum" className="font-semibold text-ember">Yeni bağlantı iste</Link>.
        </p>
      )}
    </AuthShell>
  );
}
