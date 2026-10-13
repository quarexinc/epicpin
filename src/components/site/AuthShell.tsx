import { BannerArt } from "./BannerArt";

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="container-ep py-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[32px] border border-line bg-ash lg:grid-cols-2">
        <div className="relative hidden min-h-[560px] overflow-hidden bg-[#1B0E07] lg:block">
          <div className="grid-bg absolute inset-0 opacity-60" />
          <BannerArt className="absolute inset-0 h-full w-full" seed={99} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-10 pt-24">
            <div className="h-display text-3xl leading-tight">Oyun parası, hız kesmeden.</div>
            <p className="mt-2 text-sm text-bone/70">Valorant, PUBG, Roblox, Steam ve daha fazlası. Kodlar 7/24 anında teslim.</p>
          </div>
        </div>
        <div className="p-7 sm:p-12">
          <h1 className="h-display text-3xl">{title}</h1>
          <p className="mb-8 mt-2 text-sm text-mute">{sub}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
