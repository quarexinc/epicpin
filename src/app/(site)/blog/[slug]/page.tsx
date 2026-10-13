import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { one } from "@/lib/db";
import { getPosts, type Post } from "@/lib/data";
import { dateTR, img } from "@/lib/utils";
import { PostCard } from "@/components/site/PostCard";

async function get(slug: string) {
  return one<Post>("SELECT * FROM blog_posts WHERE slug = $1 AND published", [slug]);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await get((await params).slug);
  return { title: p?.title ?? "Blog", description: p?.excerpt };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const p = await get((await params).slug);
  if (!p) notFound();
  const more = (await getPosts(4)).filter((x) => x.id !== p.id).slice(0, 3);
  return (
    <article className="container-ep mt-8 max-w-3xl">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-bone"><ArrowLeft className="h-4 w-4" /> Blog</Link>
      <div className="mt-5 text-sm text-mute">{dateTR(p.created_at)}</div>
      <h1 className="h-display mt-2 text-3xl leading-tight sm:text-5xl">{p.title}</h1>
      {p.excerpt && <p className="mt-4 text-lg text-bone/75">{p.excerpt}</p>}
      {p.cover_image_id && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img(p.cover_image_id)!} alt="" className="mt-8 w-full rounded-3xl border border-line object-cover" />
      )}
      <div className="prose-ep mt-8 text-[16px]">
        {p.content.split(/\n{2,}/).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}
      </div>
      {more.length > 0 && (
        <div className="mt-16">
          <h2 className="h-display mb-5 text-2xl">Diğer yazılar</h2>
          <div className="grid gap-4 sm:grid-cols-2">{more.slice(0, 2).map((m) => <PostCard key={m.id} p={m} />)}</div>
        </div>
      )}
    </article>
  );
}
