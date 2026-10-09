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
    instructions?: string | null;
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
    is_score_show?: boolean;
    is_result_show?: boolean;
};

export type StudentAttemptParams = {
    q?: string;
    topic?: string;
    org_id?: string;
    sort_order?: string;
    access_type?: string;
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
    query.set("sort_order", params.sort_order ?? "lifo");
    if (params.access_type) query.set("access_type", params.access_type);
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

export type LeaderboardEntry = {
    rank: number;
    student_id: number;
    student_name: string;
    score: number;
    total_marks: number;
    percentage: number;
    time_taken_seconds?: number | null;
    is_current_user: boolean;
};

export type TestSeriesLeaderboardResponse = {
    series_id: number;
    series_name: string;
    total_marks: number;
    is_result_show: boolean;
    message?: string;
    total_candidates: number;
    my_rank?: number | null;
    my_score?: number | null;
    my_percentile?: number | null;
    top_score?: number | null;
    average_score?: number | null;
    leaderboard: LeaderboardEntry[];
};

export async function getTestSeriesLeaderboard(
    seriesId: string | number
): Promise<TestSeriesLeaderboardResponse> {
    const client = await createApiClient();
    return client.get<TestSeriesLeaderboardResponse>(`student/test-series/${seriesId}/leaderboard`);
}

export type RevisionQuestionItem = {
    id: number;
    attempt_id: number;
    series_id: number;
    series_name: string;
    submitted_at: string | null;
    position: number;
    question_text: string;
    marks: number;
    marks_awarded: number;
    selected_option_id: number | null;
    correct_option_id: number | null;
    status: "incorrect" | "unanswered" | "correct";
    diagram_path?: string | null;
    diagrams?: Array<{ id: number; path: string; type: number }>;
    options: Array<{
        id: number;
        ans: string;
        diagram_path?: string | null;
    }>;
};

export type RevisionQuestionsResponse = {
    total: number;
    items: RevisionQuestionItem[];
    available_series: Array<{ id: number; name: string }>;
};

export async function getRevisionQuestions(params: {
    filter_type?: "mistakes" | "unanswered" | "all";
    series_id?: number | string;
    limit?: number;
} = {}): Promise<RevisionQuestionsResponse> {
    const client = await createApiClient();
    const query = new URLSearchParams();
    if (params.filter_type) query.set("filter_type", params.filter_type);
    if (params.series_id) query.set("series_id", String(params.series_id));
    if (params.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    return client.get<RevisionQuestionsResponse>(`student/revision-questions${qs ? `?${qs}` : ""}`);
}


