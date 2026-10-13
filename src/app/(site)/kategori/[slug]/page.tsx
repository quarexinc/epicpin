import { notFound } from "next/navigation";
import { getCategories } from "@/lib/data";
import { img } from "@/lib/utils";
import { ListingBrowser } from "@/components/site/ListingBrowser";
import { Icon } from "@/components/Icon";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = (await getCategories()).find((x) => x.slug === slug);
  return { title: c ? `${c.name} e-pin ve kodları` : "Kategori" };
}

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string; sirala?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const c = (await getCategories()).find((x) => x.slug === slug);
  if (!c) notFound();
  return (
    <>
      <div className="relative overflow-hidden border-b border-line" style={{ background: `radial-gradient(70% 140% at 90% 0%, ${c.color}55, transparent 60%), #0A090C` }}>
        {c.image_id && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(c.image_id)!} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="grid-bg absolute inset-0 [mask-image:linear-gradient(180deg,#000,transparent)]" />
        <Icon name={c.icon} className="absolute -right-10 -top-10 h-80 w-80 rotate-[-12deg] opacity-20" style={{ color: c.color }} />
        <div className="container-ep relative flex items-center gap-5 py-12">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl" style={{ background: `${c.color}26`, color: c.color, boxShadow: `inset 0 0 0 1px ${c.color}55` }}>
            <Icon name={c.icon} className="h-10 w-10" />
          </span>
          <div>
            <h1 className="h-display text-3xl sm:text-5xl">{c.name}</h1>
            <p className="mt-2 text-mute">{c.description}</p>
            <span className="chip mt-3">{c.listing_count} ürün</span>
          </div>
        </div>
      </div>
      <ListingBrowser base={`/kategori/${c.slug}`} categoryId={c.id} q={sp.q} sort={sp.sirala} activeSlug={c.slug} />
    </>
  );
}
