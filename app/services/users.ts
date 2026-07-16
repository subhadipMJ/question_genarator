import { cookies } from "next/headers";
import { getApiUrl } from "../lib/api-url";

export type User = {
    id: number;
    role: number;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
};

export async function getAllUsers(): Promise<User[]> {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) throw new Error("AUTH_REQUIRED");

    const response = await fetch(getUsersApiUrl(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(error?.detail ?? `Failed to fetch users: ${response.status}`);
    }

    return response.json() as Promise<User[]>;
}

function getUsersApiUrl(): string {
    return getApiUrl("users/");
}
