import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Splash } from "@/components/Splash";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Splash />
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <Link
        href="/destek"
        className="group fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-blaze to-ember pl-4 pr-4 font-bold text-void shadow-ember transition hover:pr-5"
        aria-label="Canlı destek"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="hidden text-sm sm:inline">Destek</span>
      </Link>
    </>
  );
}
