import { cookies } from "next/headers";
import { getApiUrl } from "../lib/api-url";
import { Topic } from "./topics";

export type QuestionOption = {
    id?: number;
    q_id?: number;
    ans: string;
    is_correct: boolean;
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

export async function getAllQuestions(page = 1, pageSize = 20, topicId?: number): Promise<PaginatedQuestionResponse> {
    const baseUrl = getQuestionsApiUrl();
    const separator = baseUrl.includes("?") ? "&" : "?";
    let apiUrl = `${baseUrl}${separator}page=${page}&page_size=${pageSize}`;
    if (topicId !== undefined && topicId !== null) {
        apiUrl += `&topic_id=${topicId}`;
    }

    const response = await fetch(apiUrl, {
        headers: await getAuthorizationHeaders(),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
    }

    return response.json();
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
    const response = await fetch(getQuestionApiUrl(questionId), {
        headers: await getAuthorizationHeaders(),
        cache: "no-store",
    });

    return readApiResponse(response, "Failed to fetch question");
}

export async function createQuestion(data: CreateQuestionInput): Promise<Question> {
    const response = await fetch(getQuestionsApiUrl(), {
        method: "POST",
        headers: await getAuthorizationHeaders(true),
        body: JSON.stringify(data),
    });

    return readApiResponse(response, "Failed to create question");
}

export async function updateQuestion(
    questionId: number,
    data: UpdateQuestionInput,
): Promise<Question> {
    const response = await fetch(getQuestionApiUrl(questionId), {
        method: "PATCH",
        headers: await getAuthorizationHeaders(true),
        body: JSON.stringify(data),
    });

    return readApiResponse(response, "Failed to update question");
}

export async function createQuestionOption(
    questionId: number,
    data: QuestionOption,
): Promise<QuestionOption> {
    const optionsUrl = new URL(`${questionId}/options/`, getQuestionsApiUrl());
    const response = await fetch(optionsUrl, {
        method: "POST",
        headers: await getAuthorizationHeaders(true),
        body: JSON.stringify(data),
    });

    return readApiResponse(response, "Failed to create option");
}

async function getAuthorizationHeaders(includeJson = false): Promise<HeadersInit> {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
        throw new Error("AUTH_REQUIRED");
    }

    return {
        ...(includeJson ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
    };
}

function getQuestionsApiUrl() {
    return getApiUrl("questions/");
}

function getQuestionApiUrl(questionId: number) {
    return new URL(`${questionId}/`, getQuestionsApiUrl());
}

async function readApiResponse<T>(
    response: Response,
    fallbackMessage: string,
): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => null) as { detail?: unknown } | null;
        const detail = typeof error?.detail === "string" ? error.detail : null;
        throw new Error(detail ?? `${fallbackMessage}: ${response.status}`);
    }

    return response.json();
}
