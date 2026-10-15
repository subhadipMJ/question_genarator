import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "@/app/lib/api-url";

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const response = await fetch(getApiUrl("auth/forgot-password/reset"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            cache: "no-store",
        });

        const data = await response.text();
        return new NextResponse(data, {
            status: response.status,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: unknown) {
        return NextResponse.json(
            { detail: error instanceof Error ? error.message : "Failed to connect to backend server" },
            { status: 502 }
        );
    }
}
