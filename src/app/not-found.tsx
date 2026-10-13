import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <div className="font-display text-[8rem] font-extrabold leading-none text-transparent [-webkit-text-stroke:2px_#FF6A13]">404</div>
        <h1 className="h-display mt-4 text-2xl">Bu sayfa haritada yok</h1>
        <Link href="/" className="btn-ember mt-6">Ana sayfaya dön</Link>
      </div>
    </div>
  );
}
