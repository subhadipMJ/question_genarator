import { cookies } from "next/headers";
import { getApiUrl } from "../lib/api-url";
import type { User } from "./users";

export type Organization = {
    id: number;
    name: string;
    code: string;
    location: string | null;
    phone_number: string | null;
    is_active: boolean;
};

export async function getAllOrganizations(): Promise<Organization[]> {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) throw new Error("AUTH_REQUIRED");

    const response = await fetch(getApiUrl("organizations/"), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.status}`);
    }

    return response.json() as Promise<Organization[]>;
}

export async function getOrganization(organizationId: number): Promise<Organization> {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) throw new Error("AUTH_REQUIRED");

    const response = await fetch(getApiUrl(`organizations/${organizationId}`), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch organization: ${response.status}`);
    }

    return response.json() as Promise<Organization>;
}

export async function getOrganizationUsers(organizationId: number): Promise<User[]> {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) throw new Error("AUTH_REQUIRED");

    const response = await fetch(getApiUrl("users/"), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(error?.detail ?? `Failed to fetch organization users: ${response.status}`);
    }

    return response.json() as Promise<User[]>;
}
