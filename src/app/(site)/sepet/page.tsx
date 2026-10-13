import { getUser } from "@/lib/auth";
import { PageHead } from "@/components/site/Section";
import { CartView } from "@/components/site/CartView";

export const metadata = { title: "Sepetim" };

export default async function Page() {
  const u = await getUser();
  return (
    <>
      <PageHead title="Sepetim" />
      <CartView user={u ? { balance: u.balance } : null} />
    </>
  );
}
