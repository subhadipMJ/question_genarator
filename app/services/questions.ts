import { createApiClient } from "../lib/api-client";
import { Topic } from "./topics";

export type QuestionOption = {
    id?: number;
    q_id?: number;
    ans: string;
    is_correct: boolean;
    diagram_id?: number | null;
    diagram_path?: string | null;
};

export type DiagramItem = {
    id: number;
    type: number;
    ref_id: number;
    org_id: number;
    user_id: number;
    path: string;
};

export type Question = {
    id: number;
    question: string;
    title?: string;
    organization_id: number;
    user_id: number;
    is_global: boolean;
    marks: string;
    is_active: boolean;
    topic_id?: number | null;
    topic?: Topic | null;
    options?: QuestionOption[];
    diagram_id?: number | null;
    diagram_path?: string | null;
    diagrams?: DiagramItem[];
};

export type CreateQuestionInput = {
    question: string;
    marks: string;
    is_active: boolean;
    topic_id?: number | null;
};

export type UpdateQuestionInput = Partial<CreateQuestionInput> & {
    options?: Array<Pick<QuestionOption, "ans" | "is_correct">>;
};

export type PaginatedQuestionResponse = {
    items: Question[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
};

export async function getAllQuestions(page = 1, pageSize = 10, topicId?: number): Promise<PaginatedQuestionResponse> {
    const client = await createApiClient();
    let path = `questions/?page=${page}&page_size=${pageSize}`;
    if (topicId !== undefined && topicId !== null) {
        path += `&topic_id=${topicId}`;
    }
    return client.get<PaginatedQuestionResponse>(path);
}

export async function getAllQuestionsList(): Promise<Question[]> {
    let page = 1;
    let allItems: Question[] = [];
    let totalPages = 1;

    do {
        const res = await getAllQuestions(page, 100);
        allItems = [...allItems, ...res.items];
        totalPages = res.total_pages;
        page++;
    } while (page <= totalPages);

    return allItems;
}

export async function getQuestion(questionId: number): Promise<Question> {
    const client = await createApiClient();
    return client.get<Question>(`questions/${questionId}`);
}

export async function createQuestion(data: CreateQuestionInput): Promise<Question> {
    const client = await createApiClient();
    return client.post<Question>("questions/", data);
}

export async function updateQuestion(questionId: number, data: UpdateQuestionInput): Promise<Question> {
    const client = await createApiClient();
    return client.patch<Question>(`questions/${questionId}`, data);
}

export async function deleteQuestion(questionId: number): Promise<void> {
    const client = await createApiClient();
    await client.delete(`questions/${questionId}`);
}

export async function createQuestionOption(questionId: number, data: QuestionOption): Promise<QuestionOption> {
    const client = await createApiClient();
    return client.post<QuestionOption>(`questions/${questionId}/options/`, data);
}
