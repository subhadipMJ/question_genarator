import { createApiClient } from "../lib/api-client";

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
    const client = await createApiClient();
    return client.get<Topic[]>("topics/");
}

export async function getTopic(topicId: number): Promise<Topic> {
    const client = await createApiClient();
    return client.get<Topic>(`topics/${topicId}`);
}

export async function createTopic(data: CreateTopicInput): Promise<Topic> {
    const client = await createApiClient();
    return client.post<Topic>("topics/", data);
}

export async function updateTopic(topicId: number, data: UpdateTopicInput): Promise<Topic> {
    const client = await createApiClient();
    return client.patch<Topic>(`topics/${topicId}`, data);
}

export async function deleteTopic(topicId: number): Promise<{ detail: string }> {
    const client = await createApiClient();
    return client.delete<{ detail: string }>(`topics/${topicId}`);
}
