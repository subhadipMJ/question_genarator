import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "../../../lib/api-url";

export async function PATCH(request: NextRequest, context: RouteContext<"/api/organizations/[id]">) {
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
        const body = await request.json();
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
