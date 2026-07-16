import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const response = NextResponse.redirect(new URL("/login", request.url), 303);
    response.cookies.delete("access_token");
    response.cookies.delete("user_name");
    response.cookies.delete("user_role");
    response.cookies.delete("organization_name");
    return response;
}
