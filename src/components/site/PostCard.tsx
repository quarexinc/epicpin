import Link from "next/link";
import { dateTR, img } from "@/lib/utils";

export function PostCard({ p }: { p: { slug: string; title: string; excerpt: string; cover_image_id: string | null; created_at: string } }) {
  return (
    <Link href={`/blog/${p.slug}`} className="group block overflow-hidden rounded-3xl border border-line bg-ash transition duration-300 hover:-translate-y-1 hover:border-ember/50">
      <div className="relative h-44 overflow-hidden">
        {p.cover_image_id ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(p.cover_image_id)!} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="relative h-full w-full bg-gradient-to-br from-ember/30 via-coal to-plasma/20">
            <div className="grid-bg absolute inset-0 opacity-70 transition duration-700 group-hover:scale-110" />
            <div className="relative flex h-full items-end p-5">
              <span className="h-display line-clamp-2 text-xl text-bone/90">{p.title}</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="text-xs text-mute">{dateTR(p.created_at)}</div>
        <h3 className="mt-1.5 font-display text-base font-bold leading-snug group-hover:text-ember">{p.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-mute">{p.excerpt}</p>
      </div>
    </Link>
  );
}
