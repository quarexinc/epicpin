import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { LISTING_SELECT, type Listing } from "@/lib/data";
import { ListingCard } from "@/components/site/ListingCard";

export const metadata = { title: "Favorilerim" };

export default async function Page() {
  const u = await requireUser("/hesabim/favoriler");
  const items = await q<Listing>(`${LISTING_SELECT} JOIN favorites f ON f.listing_id = l.id AND f.user_id = $1 WHERE l.active ORDER BY f.created_at DESC`, [u.id]);
  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold">Favorilerim</h1>
      {items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((l) => <ListingCard key={l.id} l={l} fav />)}
        </div>
      ) : (
        <div className="panel grid place-items-center p-16 text-center">
          <Heart className="h-10 w-10 text-mute" />
          <p className="mt-3 text-sm text-mute">Beğendiğin ürünlerdeki kalp simgesine dokun, burada toplansın.</p>
          <Link href="/ilanlar" className="btn-ember mt-4">Ürünlere göz at</Link>
        </div>
      )}
    </div>
  );
}
