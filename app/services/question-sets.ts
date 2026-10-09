import { createApiClient } from "../lib/api-client";

export type QuestionSetItem = {
    id: number;
    name: string;
    org_id: number | null;
    user_id: number;
    is_active: boolean;
    visibility: number; // 0 = Organization only, 1 = Public
    question_count: number;
};

export type QuestionInSet = {
    set_question_id: number;
    id: number;
    question: string;
    marks: number;
    topic_id: number | null;
    topic_name: string | null;
    diagram_path?: string | null;
    is_global: boolean;
    options: Array<{
        id: number;
        ans: string;
        is_correct: boolean;
    }>;
};

export type QuestionSetDetail = {
    id: number;
    name: string;
    org_id: number | null;
    user_id: number;
    is_active: boolean;
    visibility: number;
    question_count: number;
    questions: QuestionInSet[];
};

export type CreateQuestionSetInput = {
    name: string;
    visibility?: number;
};

export type UpdateQuestionSetInput = {
    name?: string;
    visibility?: number;
    is_active?: boolean;
};

export type ConvertToTestSeriesInput = {
    name?: string;
    duration_minutes: number;
    valid_until: string;
    access_type: "public" | "invite_only" | "private";
};

export async function getQuestionSets(): Promise<QuestionSetItem[]> {
    const client = await createApiClient();
    return client.get<QuestionSetItem[]>("question-sets");
}

export async function getQuestionSet(id: number | string): Promise<QuestionSetDetail> {
    const client = await createApiClient();
    return client.get<QuestionSetDetail>(`question-sets/${id}`);
}

export async function createQuestionSet(data: CreateQuestionSetInput): Promise<QuestionSetItem> {
    const client = await createApiClient();
    return client.post<QuestionSetItem>("question-sets", data);
}

export async function updateQuestionSet(id: number | string, data: UpdateQuestionSetInput): Promise<QuestionSetItem> {
    const client = await createApiClient();
    return client.put<QuestionSetItem>(`question-sets/${id}`, data);
}

export async function deleteQuestionSet(id: number | string): Promise<{ message: string }> {
    const client = await createApiClient();
    return client.delete<{ message: string }>(`question-sets/${id}`);
}

export async function copyQuestionSet(id: number | string): Promise<QuestionSetItem> {
    const client = await createApiClient();
    return client.post<QuestionSetItem>(`question-sets/${id}/copy`, {});
}

export async function addQuestionsToSet(id: number | string, questionIds: number[]): Promise<{ message: string; question_ids: number[] }> {
    const client = await createApiClient();
    return client.post<{ message: string; question_ids: number[] }>(`question-sets/${id}/questions`, {
        question_ids: questionIds,
    });
}

export async function removeQuestionFromSet(id: number | string, questionId: number | string): Promise<{ message: string }> {
    const client = await createApiClient();
    return client.delete<{ message: string }>(`question-sets/${id}/questions/${questionId}`);
}

export async function convertSetToTestSeries(
    id: number | string,
    data: ConvertToTestSeriesInput
): Promise<{ id: number; name: string; code: string; access_type: string; question_count: number; message: string }> {
    const client = await createApiClient();
    return client.post(`question-sets/${id}/convert-to-test-series`, data);
}
