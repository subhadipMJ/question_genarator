import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createBackendProxy, unauthorizedResponse, errorResponse } from "../../../lib/backend-proxy";

export async function PATCH(request: NextRequest, context: RouteContext<"/api/organizations/[id]">) {
    try {
        const cookieStore = await cookies();
        const proxy = await createBackendProxy();
        if (!proxy) return unauthorizedResponse();

        const role = cookieStore.get("user_role")?.value;
        if (role !== "0" && role !== "1") {
            return NextResponse.json({ message: "Admin access required." }, { status: 403 });
        }

        const { id } = await context.params;
        const organizationId = Number(id);
        if (!Number.isInteger(organizationId) || organizationId < 1) {
            return NextResponse.json({ message: "Invalid organization ID." }, { status: 400 });
        }

        if (role === "1" && cookieStore.get("organization_id")?.value !== String(organizationId)) {
            return NextResponse.json({ message: "You can only edit your own organization." }, { status: 403 });
        }

        const requestedBody = await request.json() as Record<string, unknown>;
        const allowedFields = role === "0"
            ? ["name", "location", "phone_number", "is_active"]
            : ["name", "location", "phone_number"];
        const body = Object.fromEntries(
            Object.entries(requestedBody).filter(([key]) => allowedFields.includes(key)),
        );

        if (Object.keys(body).length === 0) {
            return NextResponse.json({ message: "No editable organization fields were provided." }, { status: 400 });
        }

        return proxy.forward(`organizations/${organizationId}`, { method: "PATCH", body });
    } catch {
        return errorResponse("Unable to update organization.");
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext<"/api/organizations/[id]">) {
    try {
        const cookieStore = await cookies();
        const proxy = await createBackendProxy();
        if (!proxy) return unauthorizedResponse();

        if (cookieStore.get("user_role")?.value !== "0") {
            return NextResponse.json({ message: "Super admin access required." }, { status: 403 });
        }

        const { id } = await context.params;
        const organizationId = Number(id);
        if (!Number.isInteger(organizationId) || organizationId < 1) {
            return NextResponse.json({ message: "Invalid organization ID." }, { status: 400 });
        }

        return proxy.forward(`organizations/${organizationId}`, { method: "DELETE" });
    } catch {
        return errorResponse("Unable to delete organization.");
    }
}
