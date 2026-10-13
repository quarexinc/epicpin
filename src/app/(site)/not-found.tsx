import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-ep grid place-items-center py-28 text-center">
      <div className="font-display text-[8rem] font-extrabold leading-none text-transparent [-webkit-text-stroke:2px_#FF6A13]">404</div>
      <h1 className="h-display mt-4 text-2xl">Bu sayfa haritada yok</h1>
      <p className="mt-2 text-mute">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Link href="/" className="btn-ember mt-6">Ana sayfaya dön</Link>
    </div>
  );
}
