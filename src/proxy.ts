import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") {
    // اگر قبلاً وارد شده، مستقیم به داشبورد برود
    if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }
  if (!(await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value))) {
    const url = new URL("/admin/login", request.url);
    if (pathname !== "/admin") url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
