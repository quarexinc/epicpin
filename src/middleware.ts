import { NextResponse, type NextRequest } from "next/server";

/**
 * Giriş gerektiren sayfalar: oturum çerezi hiç yoksa sayfa yüklenmeden doğrudan giriş sayfasına yönlendirilir.
 * (Çerez varsa geçerliliği sayfanın kendisinde veritabanından kontrol edilir.)
 */
export function middleware(req: NextRequest) {
  if (req.cookies.get("ep_session")?.value) return NextResponse.next();
  const url = req.nextUrl.clone();
  const next = req.nextUrl.pathname + req.nextUrl.search;
  url.pathname = "/giris";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ["/hesabim/:path*", "/bakiye-yukle", "/odeme/kart/:path*", "/admin/:path*", "/destek/:id(\\d+)"],
};
