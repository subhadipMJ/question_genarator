import { createApiClient } from "../lib/api-client";
import type { User } from "./users";

export interface AnswerKey {
    id: number;
    test_series_id: number;
    path: string;
    created_at: string;
    updated_at: string;
}

export type SeriesQuestionInput = {
    question_id: number;
    marks?: number | null;
    negative_marks?: number | null;
};

export type TestSeries = {
    id: number;
    name: string;
    code: string | null;
    invite_token: string | null;
    access_type: "public" | "invite_only" | "private";
    org_id: number;
    created_by: number;
    teacher_group_id?: number | null;
    supervisor_id?: number | null;
    valid_until: string;
    duration_seconds: number;
    is_active: boolean;
    questions: SeriesQuestionInput[];
    attempt_count?: number;
    is_result_show?: boolean;
    is_score_show?: boolean;
    batch_id?: number | null;
    batch_ids?: number[];
    student_ids?: number[];
    result_file_key?: string | null;
    answer_key?: AnswerKey | null;
};

export type TestSeriesCreate = {
    name: string;
    access_type: "public" | "invite_only" | "private";
    teacher_group_id?: number | null;
    supervisor_id?: number | null;
    valid_until: string;
    duration_seconds: number;
    questions: SeriesQuestionInput[];
    is_active?: boolean;
    batch_id?: number | null;
    batch_ids?: number[];
    student_ids?: number[];
};

export type TestSeriesUpdate = {
    name?: string;
    access_type?: "public" | "invite_only" | "private";
    teacher_group_id?: number | null;
    supervisor_id?: number | null;
    valid_until?: string;
    duration_seconds?: number;
    questions?: SeriesQuestionInput[];
    is_active?: boolean;
    is_result_show?: boolean;
    is_score_show?: boolean;
    batch_id?: number | null;
    batch_ids?: number[];
    student_ids?: number[];
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
    is_result_show?: boolean;
    is_score_show?: boolean;
    total_attempts: number;
    completed_attempts: number;
    average_score: number;
    result_file_key?: string | null;
    answer_key?: AnswerKey | null;
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

export async function uploadAnswerKey(seriesId: number, file: File): Promise<AnswerKey> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/backend/test-series/${seriesId}/result-sheet`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to upload answer key PDF");
    }

    return response.json();
}

export async function getAnswerKey(seriesId: number): Promise<AnswerKey | null> {
    const response = await fetch(`/api/backend/test-series/${seriesId}/result-sheet`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch answer key");
    }
    return response.json();
}

export async function deleteAnswerKey(seriesId: number): Promise<boolean> {
    const response = await fetch(`/api/backend/test-series/${seriesId}/result-sheet`, {
        method: "DELETE",
    });
    return response.ok;
}

export type PaginatedStudentsResponse = {
    items: User[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
};

export async function getTestSeriesStudents(
    seriesId: number,
    params?: { page?: number; limit?: number; sort_order?: string; q?: string; exclude_batch_ids?: string }
): Promise<PaginatedStudentsResponse> {
    const client = await createApiClient();
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.sort_order) query.set("sort_order", params.sort_order);
    if (params?.q) query.set("q", params.q);
    if (params?.exclude_batch_ids !== undefined) query.set("exclude_batch_ids", params.exclude_batch_ids);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return client.get<PaginatedStudentsResponse>(`test-series/${seriesId}/students${qs}`);
}

