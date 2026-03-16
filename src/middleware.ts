import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkPermissionSync, PAGE_PERMISSION_MAP } from "@/lib/permissions-shared";

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isLoginPage = pathname.startsWith("/giris");
  const isTanitimPage = pathname.startsWith("/tanitim");
  const isSunumEkran = pathname.startsWith("/sunum-ekran");
  const isApiRoute = pathname.startsWith("/api");

  // Middleware runs on the edge runtime, so use JWT-only verification here.
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (isApiRoute || isTanitimPage || isSunumEkran) {
    return NextResponse.next();
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (!isLoginPage && !token) {
    return NextResponse.redirect(new URL("/giris", req.nextUrl));
  }

  // Dinamik rol bazlı sayfa erişim kontrolü
  if (token?.role && pathname !== "/") {
    const role = token.role as string;

    // Temel kullanıcılar (USER, VIEWER) sadece portala erişir — modül sayfalarına giremez
    const PORTAL_ONLY_ROLES = ["USER", "VIEWER"];
    const isAyarlar = pathname === "/ayarlar" || pathname.startsWith("/ayarlar/");
    if (PORTAL_ONLY_ROLES.includes(role) && !isAyarlar) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    // PAGE_PERMISSION_MAP'ten ilgili izni bul
    const matchedPath = Object.keys(PAGE_PERMISSION_MAP)
      .sort((a, b) => b.length - a.length) // En spesifik path önce
      .find((p) => pathname === p || pathname.startsWith(p + "/"));

    if (matchedPath) {
      const requiredPerm = PAGE_PERMISSION_MAP[matchedPath];
      const result = checkPermissionSync(role, requiredPerm);

      if (!result.allowed) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
