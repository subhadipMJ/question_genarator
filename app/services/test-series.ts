import { cookies } from "next/headers";
import { getApiUrl } from "../lib/api-url";

export type TestSeries = {
    id: number;
    name: string;
    code: string | null;
    invite_token: string | null;
    access_type: "public" | "invite_only";
    org_id: number;
    created_by: number;
    valid_until: string;
    duration_seconds: number;
    is_active: boolean;
    question_ids: number[];
};

export type TestSeriesCreate = {
    name: string;
    access_type: "public" | "invite_only";
    valid_until: string;
    duration_seconds: number;
    question_ids: number[];
    is_active?: boolean;
};

async function getAuthHeaders(includeJson = false): Promise<HeadersInit> {
    const token = (await cookies()).get("access_token")?.value;
    if (!token) throw new Error("AUTH_REQUIRED");
    return {
        ...(includeJson ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
    };
}

export async function getAllTestSeries(): Promise<TestSeries[]> {
    const response = await fetch(getApiUrl("test-series/"), {
        headers: await getAuthHeaders(),
        cache: "no-store",
    });
    if (!response.ok) throw new Error(`Failed to fetch test series: ${response.status}`);
    return response.json();
}

export async function getTestSeries(seriesId: number): Promise<TestSeries> {
    const response = await fetch(getApiUrl(`test-series/${seriesId}`), {
        headers: await getAuthHeaders(),
        cache: "no-store",
    });
    if (!response.ok) throw new Error(`Failed to fetch test series: ${response.status}`);
    return response.json();
}
