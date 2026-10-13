import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCategories } from "@/lib/data";
import { AdminTitle } from "@/components/admin/Fields";
import { ListingForm } from "@/components/admin/ListingForm";

export default async function Page() {
  const cats = await getCategories(true);
  return (
    <>
      <Link href="/admin/ilanlar" className="mb-3 inline-flex items-center gap-1.5 text-sm text-mute hover:text-bone"><ArrowLeft className="h-4 w-4" /> İlanlar</Link>
      <AdminTitle title="Yeni ilan" />
      <ListingForm cats={cats} />
    </>
  );
}
