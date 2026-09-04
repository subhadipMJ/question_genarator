/**
 * api-client.ts
 *
 * A server-side API client for Next.js Server Components and service files.
 * Reads the auth token from cookies and provides a typed fetch wrapper.
 *
 * Usage:
 *   const client = await createApiClient();
 *   const data = await client.get<Organization[]>("organizations/");
 *   const created = await client.post<Topic>("topics/", payload);
 */

import { cookies } from "next/headers";
import { getApiUrl } from "./api-url";

type FetchOptions = Omit<RequestInit, "headers" | "body">;

export class ApiClient {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private buildHeaders(includeJson = false): HeadersInit {
        return {
            Authorization: `Bearer ${this.token}`,
            ...(includeJson ? { "Content-Type": "application/json" } : {}),
        };
    }

    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        const response = await fetch(getApiUrl(path), {
            cache: "no-store",
            ...init,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null) as { detail?: unknown } | null;
            const detail = typeof error?.detail === "string" ? error.detail : null;
            throw new Error(detail ?? `Request failed: ${response.status}`);
        }

        return response.json() as Promise<T>;
    }

    get<T>(path: string, options?: FetchOptions): Promise<T> {
        return this.request<T>(path, { ...options, method: "GET", headers: this.buildHeaders() });
    }

    post<T>(path: string, body: unknown, options?: FetchOptions): Promise<T> {
        return this.request<T>(path, {
            ...options,
            method: "POST",
            headers: this.buildHeaders(true),
            body: JSON.stringify(body),
        });
    }

    put<T>(path: string, body: unknown, options?: FetchOptions): Promise<T> {
        return this.request<T>(path, {
            ...options,
            method: "PUT",
            headers: this.buildHeaders(true),
            body: JSON.stringify(body),
        });
    }

    patch<T>(path: string, body: unknown, options?: FetchOptions): Promise<T> {

        return this.request<T>(path, {
            ...options,
            method: "PATCH",
            headers: this.buildHeaders(true),
            body: JSON.stringify(body),
        });
    }

    delete<T>(path: string, options?: FetchOptions): Promise<T> {
        return this.request<T>(path, { ...options, method: "DELETE", headers: this.buildHeaders() });
    }
}

/**
 * Creates an ApiClient by reading the auth token from cookies.
 * Throws "AUTH_REQUIRED" if no token is found — matches the existing service convention.
 */
export async function createApiClient(): Promise<ApiClient> {
    const token = (await cookies()).get("access_token")?.value;
    if (!token) throw new Error("AUTH_REQUIRED");
    return new ApiClient(token);
}
