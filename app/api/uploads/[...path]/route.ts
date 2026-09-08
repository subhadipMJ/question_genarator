import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "../../../lib/api-url";

export async function GET(request: NextRequest, context: RouteContext<"/api/uploads/[...path]">) {
    const token = (await cookies()).get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

    const { path } = await context.params;
    const url = getApiUrl(`uploads/${path.join("/")}`);

    let response: Response;
    try {
        response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
    } catch {
        return NextResponse.json({ message: "Unable to reach the server." }, { status: 502 });
    }

    if (!response.ok) {
        return NextResponse.json({ message: "File not found." }, { status: response.status });
    }

    const body = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    return new NextResponse(body, {
        status: 200,
        headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=300" },
    });
}
