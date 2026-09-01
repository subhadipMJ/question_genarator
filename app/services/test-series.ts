import { createApiClient } from "../lib/api-client";

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
    attempt_count?: number;
    is_result_show?: boolean;
    is_score_show?: boolean;
};

export type TestSeriesCreate = {
    name: string;
    access_type: "public" | "invite_only";
    valid_until: string;
    duration_seconds: number;
    question_ids: number[];
    is_active?: boolean;
};

export type TestSeriesUpdate = {
    name?: string;
    access_type?: "public" | "invite_only";
    valid_until?: string;
    duration_seconds?: number;
    question_ids?: number[];
    is_active?: boolean;
    is_result_show?: boolean;
    is_score_show?: boolean;
};

export type TestSeriesResultItem = {
    attempt_id: number;
    user_id: number;
    student_name: string;
    student_email: string;
    started_at: string;
    submitted_at: string | null;
    status: number | string;
    score: number;
    total_marks: number;
    percentage: number;
};

export type TestSeriesResults = {
    series_id: number;
    series_name: string;
    invite_token?: string | null;
    access_type?: string;
    total_attempts: number;
    completed_attempts: number;
    average_score: number;
    results: TestSeriesResultItem[];
};

export async function getAllTestSeries(): Promise<TestSeries[]> {
    const client = await createApiClient();
    return client.get<TestSeries[]>("test-series/");
}

export async function getTestSeries(seriesId: number): Promise<TestSeries> {
    const client = await createApiClient();
    return client.get<TestSeries>(`test-series/${seriesId}`);
}

export async function updateTestSeries(seriesId: number, data: TestSeriesUpdate): Promise<TestSeries> {
    const client = await createApiClient();
    return client.patch<TestSeries>(`test-series/${seriesId}`, data);
}

export async function getTestSeriesResults(seriesId: number): Promise<TestSeriesResults> {
    const client = await createApiClient();
    return client.get<TestSeriesResults>(`test-series/${seriesId}/results`);
}

export async function deleteTestSeries(seriesId: number): Promise<void> {
    const client = await createApiClient();
    await client.delete(`test-series/${seriesId}`);
}

