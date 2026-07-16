import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "../../../lib/api-url";

async function forward(request: NextRequest, context: RouteContext<"/api/backend/[...path]">) {
    const token = (await cookies()).get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

    const { path } = await context.params;
    const upstreamPath = `${path.join("/")}${request.nextUrl.pathname.endsWith("/") ? "/" : ""}`;
    const url = new URL(getApiUrl(upstreamPath));
    url.search = request.nextUrl.search;
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const response = await fetch(url, {
        method: request.method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(hasBody ? { "Content-Type": request.headers.get("content-type") ?? "application/json" } : {}),
        },
        body: hasBody ? await request.text() : undefined,
        cache: "no-store",
    });
    const body = response.status === 204 ? null : await response.text();
    const nextResponse = new NextResponse(body, {
        status: response.status,
        headers: body ? { "Content-Type": response.headers.get("content-type") ?? "application/json" } : undefined,
    });
    if (response.status === 401) clearSession(nextResponse);
    return nextResponse;
}

function clearSession(response: NextResponse) {
    for (const name of ["access_token", "user_id", "user_name", "user_role", "organization_id", "organization_name"]) {
        response.cookies.delete(name);
    }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
