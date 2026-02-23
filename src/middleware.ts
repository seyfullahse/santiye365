import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname.startsWith("/giris");
  const isTanitimPage = req.nextUrl.pathname.startsWith("/tanitim");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  // Middleware runs on the edge runtime, so use JWT-only verification here.
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (isApiRoute || isTanitimPage) {
    return NextResponse.next();
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (!isLoginPage && !token) {
    return NextResponse.redirect(new URL("/giris", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
