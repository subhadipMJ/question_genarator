import { createApiClient } from "../lib/api-client";

export type User = {
    id: number;
    role: number;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
};

export async function getAllUsers(): Promise<User[]> {
    const client = await createApiClient();
    return client.get<User[]>("users/");
}

export async function getUser(userId: number): Promise<User> {
    const client = await createApiClient();
    return client.get<User>(`users/${userId}`);
}
