import Link from "next/link";
import { dateTR, img } from "@/lib/utils";

export function PostCard({ p }: { p: { slug: string; title: string; excerpt: string; cover_image_id: string | null; created_at: string } }) {
  return (
    <Link href={`/blog/${p.slug}`} className="group overflow-hidden rounded-3xl border border-line bg-ash transition hover:border-ember/50">
      <div className="relative h-44 overflow-hidden">
        {p.cover_image_id ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(p.cover_image_id)!} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid-bg h-full w-full bg-gradient-to-br from-ember/30 via-coal to-plasma/20">
            <div className="flex h-full items-end p-5">
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
