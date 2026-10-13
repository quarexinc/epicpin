import { PageHead } from "@/components/site/Section";
import { ListingBrowser } from "@/components/site/ListingBrowser";

export const metadata = { title: "İlan pazarı" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; sirala?: string }> }) {
  const sp = await searchParams;
  const title = sp.sirala === "indirim" ? "Haftanın fırsatları" : sp.sirala === "populer" ? "Çok satanlar" : "İlan pazarı";
  return (
    <>
      <PageHead title={title} sub="Tüm e-pin, oyun parası ve hediye kartları tek yerde. Otomatik teslimatlı ürünlerde kod anında hesabında." />
      <ListingBrowser base="/ilanlar" q={sp.q?.slice(0, 80)} sort={sp.sirala} />
    </>
  );
}
