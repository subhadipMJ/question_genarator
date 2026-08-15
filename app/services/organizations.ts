import { createApiClient } from "../lib/api-client";
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
    const client = await createApiClient();
    return client.get<Organization[]>("organizations/");
}

export async function getOrganization(organizationId: number): Promise<Organization> {
    const client = await createApiClient();
    return client.get<Organization>(`organizations/${organizationId}`);
}

export async function getOrganizationUsers(organizationId: number): Promise<User[]> {
    const client = await createApiClient();
    return client.get<User[]>(`organizations/${organizationId}/users`);
}
