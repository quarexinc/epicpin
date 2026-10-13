import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthShell } from "@/components/site/AuthShell";
import { RegisterForm } from "@/components/site/AuthForms";

export const metadata = { title: "Kayıt ol" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  if (await getUser()) redirect("/");
  return (
    <AuthShell title="Hesap oluştur" sub="30 saniyede üye ol, ilk kodunu hemen al.">
      <RegisterForm next={next} />
    </AuthShell>
  );
}
