import { getPosts } from "@/lib/data";
import { PageHead } from "@/components/site/Section";
import { PostCard } from "@/components/site/PostCard";

export const metadata = { title: "Blog" };

export default async function Page() {
  const posts = await getPosts();
  return (
    <>
      <PageHead title="Blog" sub="Rehberler, kampanyalar ve oyun dünyasından haberler." />
      <div className="container-ep mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => <PostCard key={p.id} p={p} />)}
        {!posts.length && <p className="text-mute">Henüz yazı yok.</p>}
      </div>
    </>
  );
}
