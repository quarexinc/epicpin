import Link from "next/link";
import { getCategories } from "@/lib/data";
import { img } from "@/lib/utils";
import { PageHead } from "@/components/site/Section";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Tüm kategoriler" };

export default async function Page() {
  const cats = await getCategories();
  return (
    <>
      <PageHead title="Tüm kategoriler" sub="Oyununu ya da platformunu seç." />
      <div className="container-ep mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cats.map((c) => (
          <Link
            key={c.id}
            href={`/kategori/${c.slug}`}
            className="group relative h-44 overflow-hidden rounded-3xl border border-line p-5 transition hover:border-white/20"
            style={{ background: `radial-gradient(100% 100% at 100% 100%, ${c.color}55, transparent 65%), #121016` }}
          >
            {c.image_id ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img(c.image_id)!} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50 transition group-hover:scale-105" />
            ) : (
              <Icon name={c.icon} className="absolute -bottom-6 -right-6 h-32 w-32 rotate-[-12deg] opacity-35 transition duration-500 group-hover:rotate-0" style={{ color: c.color }} />
            )}
            <div className="relative flex h-full flex-col justify-between">
              <span className="w-fit rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold">{c.listing_count} ürün</span>
              <div>
                <div className="h-display text-xl leading-tight">{c.name}</div>
                <div className="mt-1 line-clamp-1 text-xs text-bone/60">{c.description}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
