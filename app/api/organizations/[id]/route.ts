import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "../../../lib/api-url";

export async function PATCH(request: NextRequest, context: RouteContext<"/api/organizations/[id]">) {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    const role = cookieStore.get("user_role")?.value;
    if (role !== "0" && role !== "1") return NextResponse.json({ message: "Admin access required." }, { status: 403 });

    const { id } = await context.params;
    const organizationId = Number(id);
    if (!Number.isInteger(organizationId) || organizationId < 1) {
        return NextResponse.json({ message: "Invalid organization ID." }, { status: 400 });
    }

    if (role === "1" && cookieStore.get("organization_id")?.value !== String(organizationId)) {
        return NextResponse.json({ message: "You can only edit your own organization." }, { status: 403 });
    }

    try {
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
        const response = await fetch(getApiUrl(`organizations/${organizationId}`), {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });
        const result = await response.json().catch(() => null);

        if (!response.ok) {
            return NextResponse.json(
                { message: getErrorMessage(result, response.status) },
                { status: response.status },
            );
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Unable to update organization." },
            { status: 500 },
        );
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext<"/api/organizations/[id]">) {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    if (cookieStore.get("user_role")?.value !== "0") {
        return NextResponse.json({ message: "Super admin access required." }, { status: 403 });
    }

    const { id } = await context.params;
    const organizationId = Number(id);
    if (!Number.isInteger(organizationId) || organizationId < 1) {
        return NextResponse.json({ message: "Invalid organization ID." }, { status: 400 });
    }

    try {
        const response = await fetch(getApiUrl(`organizations/${organizationId}`), {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!response.ok) {
            const result = await response.json().catch(() => null);
            return NextResponse.json(
                { message: getErrorMessage(result, response.status) },
                { status: response.status },
            );
        }

        return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Unable to delete organization." },
            { status: 500 },
        );
    }
}

function getErrorMessage(result: unknown, status: number): string {
    if (result && typeof result === "object" && "detail" in result) {
        const detail = (result as { detail?: unknown }).detail;
        if (typeof detail === "string") return detail;
        if (Array.isArray(detail)) {
            return detail.flatMap((item) =>
                item && typeof item === "object" && "msg" in item ? [String(item.msg)] : [],
            ).join(" ");
        }
    }
    return `Unable to update organization (${status}).`;
}
