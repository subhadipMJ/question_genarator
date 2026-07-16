import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "../../lib/api-url";

export async function POST(request: NextRequest) {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
        return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    try {
        const body = await request.json();
        const response = await fetch(getApiUrl("organizations/"), {
            method: "POST",
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

        return NextResponse.json(result, { status: response.status });
    } catch (error: unknown) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Unable to create organization." },
            { status: 500 },
        );
    }
}

function getErrorMessage(result: unknown, status: number): string {
    if (result && typeof result === "object" && "detail" in result) {
        const detail = (result as { detail?: unknown }).detail;
        if (typeof detail === "string") return detail;
    }

    return `Unable to create organization (${status}).`;
}
