import { cookies } from "next/headers";
import { getApiUrl } from "../lib/api-url";

export type Topic = {
    id: number;
    org_id: number;
    name: string;
    color: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type CreateTopicInput = {
    name: string;
    color: string;
    is_active: boolean;
};

export type UpdateTopicInput = Partial<CreateTopicInput>;

export async function getAllTopics(): Promise<Topic[]> {
    const response = await fetch(getTopicsApiUrl(), {
        headers: await getAuthorizationHeaders(),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.status}`);
    }

    return response.json();
}

export async function getTopic(topicId: number): Promise<Topic> {
    const response = await fetch(getTopicApiUrl(topicId), {
        headers: await getAuthorizationHeaders(),
        cache: "no-store",
    });

    return readApiResponse(response, "Failed to fetch topic");
}

export async function createTopic(data: CreateTopicInput): Promise<Topic> {
    const response = await fetch(getTopicsApiUrl(), {
        method: "POST",
        headers: await getAuthorizationHeaders(true),
        body: JSON.stringify(data),
    });

    return readApiResponse(response, "Failed to create topic");
}

export async function updateTopic(
    topicId: number,
    data: UpdateTopicInput,
): Promise<Topic> {
    const response = await fetch(getTopicApiUrl(topicId), {
        method: "PATCH",
        headers: await getAuthorizationHeaders(true),
        body: JSON.stringify(data),
    });

    return readApiResponse(response, "Failed to update topic");
}

export async function deleteTopic(topicId: number): Promise<{ detail: string }> {
    const response = await fetch(getTopicApiUrl(topicId), {
        method: "DELETE",
        headers: await getAuthorizationHeaders(),
    });

    return readApiResponse(response, "Failed to delete topic");
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

function getTopicsApiUrl() {
    return getApiUrl("topics/");
}

function getTopicApiUrl(topicId: number) {
    return new URL(`${topicId}/`, getTopicsApiUrl());
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
