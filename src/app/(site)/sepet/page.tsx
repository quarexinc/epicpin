import { getUser } from "@/lib/auth";
import { PageHead } from "@/components/site/Section";
import { CartView } from "@/components/site/CartView";
import { shopierMethod, shopierReady } from "@/lib/shopierFlow";

export const metadata = { title: "Sepetim" };

export default async function Page() {
  const [u, ready, m] = await Promise.all([getUser(), shopierReady(), shopierMethod()]);
  return (
    <>
      <PageHead title="Sepetim" />
      <CartView user={u ? { balance: u.balance } : null} card={ready && m ? { commission: Number(m.commission) || 0 } : null} />
    </>
  );
}
