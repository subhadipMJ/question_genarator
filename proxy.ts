import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hasToken = request.cookies.has("access_token");
  const isLoginPage = request.nextUrl.pathname === "/login";
  const user_role = request.cookies.get("user_role")?.value;

  if (!hasToken && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasToken && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard", "/super-admin/:path*", "/questions/:path*"],
};
