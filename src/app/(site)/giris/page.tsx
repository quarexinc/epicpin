import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils";
import { AuthShell } from "@/components/site/AuthShell";
import { LoginForm } from "@/components/site/AuthForms";

export const metadata = { title: "Giriş yap" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  if (await getUser()) redirect(safeNext(next));
  return (
    <AuthShell title="Tekrar hoş geldin" sub="Hesabına giriş yap, kaldığın yerden devam et.">
      <LoginForm next={safeNext(next)} />
    </AuthShell>
  );
}
