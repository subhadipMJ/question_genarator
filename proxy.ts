import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hasToken = request.cookies.has("access_token");
  const pathname = request.nextUrl.pathname;
  const isPublicPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/organizations/create" ||
    pathname === "/reset-password";

  if (!hasToken && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasToken && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [ "/login", "/dashboard", "/super-admin/:path*", "/questions/:path*", "/organizations/:path*", "/test-series/:path*", "/student/:path*"],
};
