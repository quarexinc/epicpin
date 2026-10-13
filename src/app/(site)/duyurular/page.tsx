import Link from "next/link";
import { Megaphone, Info, TriangleAlert, Sparkles } from "lucide-react";
import { getAnnouncements } from "@/lib/data";
import { dateTR } from "@/lib/utils";
import { PageHead } from "@/components/site/Section";

export const metadata = { title: "Duyurular" };

const KIND: Record<string, [any, string]> = {
  info: [Info, "text-sky-300 bg-sky-400/10"],
  promo: [Sparkles, "text-blaze bg-ember/15"],
  warning: [TriangleAlert, "text-plasma bg-plasma/15"],
};

export default async function Page() {
  const anns = await getAnnouncements();
  return (
    <>
      <PageHead title="Duyurular" sub="Kampanyalar, yeni ürünler ve önemli bilgilendirmeler." />
      <div className="container-ep mt-8 grid max-w-3xl gap-3">
        {anns.map((a) => {
          const [I, c] = KIND[a.kind] ?? KIND.info;
          const inner = (
            <div className="panel flex gap-4 p-5 transition hover:border-ember/40">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c}`}><I className="h-5 w-5" /></span>
              <div>
                <div className="font-display font-bold">{a.title}</div>
                {a.content && <p className="mt-1 text-sm text-bone/75">{a.content}</p>}
                <div className="mt-2 text-xs text-mute">{dateTR(a.created_at)}</div>
              </div>
            </div>
          );
          return a.link ? <Link key={a.id} href={a.link}>{inner}</Link> : <div key={a.id}>{inner}</div>;
        })}
        {!anns.length && (
          <div className="panel grid place-items-center p-16 text-center text-sm text-mute">
            <Megaphone className="h-10 w-10" />
            <p className="mt-3">Şu an aktif duyuru yok.</p>
          </div>
        )}
      </div>
    </>
  );
}
