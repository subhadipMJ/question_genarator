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
    const contentType = request.headers.get("content-type");
    let response: Response;
    try {
        response = await fetch(url, {
            method: request.method,
            headers: {
                Authorization: `Bearer ${token}`,
                ...(hasBody && contentType ? { "Content-Type": contentType } : {}),
            },
            body: hasBody ? await request.arrayBuffer() : undefined,
            cache: "no-store",
        });
    } catch {
        // Upstream unreachable (network error/timeout). Return JSON so callers that
        // parse the response body don't choke on an HTML error page.
        return NextResponse.json(
            { detail: "Unable to reach the server. Please check your connection and try again." },
            { status: 502 },
        );
    }
    const body = response.status === 204 ? null : await response.arrayBuffer();
    const responseContentType = response.headers.get("content-type");
    const nextResponse = new NextResponse(body, {
        status: response.status,
        headers: body && responseContentType ? { "Content-Type": responseContentType } : undefined,
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
