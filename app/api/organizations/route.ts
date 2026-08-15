import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createBackendProxy, unauthorizedResponse, errorResponse } from "../../lib/backend-proxy";

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const proxy = await createBackendProxy();
        if (!proxy) return unauthorizedResponse();

        const role = cookieStore.get("user_role")?.value;
        if (role !== "0" && role !== "1") {
            return NextResponse.json({ message: "Admin access required." }, { status: 403 });
        }

        const body = await request.json();
        return proxy.forward("organizations/", { method: "POST", body });
    } catch {
        return errorResponse("Unable to create organization.");
    }
}
