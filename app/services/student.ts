import { createApiClient } from "../lib/api-client";

// ── Types ─────────────────────────────────────────────────────────────

export type AvailableTest = {
    id: number;
    name: string;
    org_id: number;
    valid_until: string;
    duration_seconds: number;
    question_count: number;
    topics?: string[];
};

export type PaginatedTests = {
    items: AvailableTest[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
};

export type AttemptHistory = {
    id: number;
    series_name: string;
    started_at: string;
    submitted_at: string | null;
    status: number | string;
    score: string;
    total_marks: string;
};

export type StudentAttemptParams = {
    q?: string;
    topic?: string;
    org_id?: string;
    sort_order?: string;
    page?: string;
    limit?: string;
};

// ── Service functions ─────────────────────────────────────────────────

export async function getStudentTests(params: StudentAttemptParams = {}): Promise<PaginatedTests> {
    const client = await createApiClient();
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.topic) query.set("topic", params.topic);
    if (params.org_id) query.set("org_id", params.org_id);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    if (params.page) query.set("page", params.page);
    if (params.limit) query.set("limit", params.limit);

    const qs = query.toString();
    return client.get<PaginatedTests>(`student/test-series${qs ? `?${qs}` : ""}`);
}

export async function getStudentAttempt<T>(attemptId: string | number): Promise<T> {
    const client = await createApiClient();
    return client.get<T>(`student/attempts/${attemptId}`);
}

export async function getAttemptHistory(): Promise<AttemptHistory[]> {
    const client = await createApiClient();
    return client.get<AttemptHistory[]>("student/attempt-history");
}

export async function getTestSeriesQuestions<T>(seriesId: string | number): Promise<T> {
    const client = await createApiClient();
    return client.get<T>(`test-series/${seriesId}/questions`);
}
