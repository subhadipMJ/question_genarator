/**
 * backend-proxy.ts
 *
 * A reusable utility for Next.js API routes to forward requests to the
 * backend API with authentication headers injected from cookies.
 *
 * Usage:
 *   const proxy = await createBackendProxy();
 *   if (!proxy) return unauthorizedResponse();
 *   return proxy.forward("questions/", searchParams);
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getApiUrl } from "./api-url";

// ── Standard 401 helper ───────────────────────────────────────────────
export function unauthorizedResponse() {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
}

// ── Standard 500 helper ───────────────────────────────────────────────
export function errorResponse(message = "An error occurred.") {
    return NextResponse.json({ message }, { status: 500 });
}

type RequestOptions = {
    method?: string;
    body?: unknown;
    searchParams?: URLSearchParams;
};

export class BackendProxy {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    /** Build an authenticated fetch to the backend and return the NextResponse */
    async forward(path: string, options: RequestOptions = {}): Promise<NextResponse> {
        const { method = "GET", body, searchParams } = options;

        const url = new URL(getApiUrl(path));
        if (searchParams) {
            searchParams.forEach((value, key) => url.searchParams.set(key, value));
        }

        const response = await fetch(url.toString(), {
            method,
            headers: {
                Authorization: `Bearer ${this.token}`,
                ...(body ? { "Content-Type": "application/json" } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
            cache: "no-store",
        });

        const data = await response.json().catch(() => null);
        return NextResponse.json(data, { status: response.status });
    }

    /** Just return the token for cases where you need it directly */
    getToken(): string {
        return this.token;
    }

    /** Get auth headers for use with the existing services */
    getAuthHeaders(includeJson = false): HeadersInit {
        return {
            ...(includeJson ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${this.token}`,
        };
    }
}

/**
 * Creates a BackendProxy instance after reading the auth token from cookies.
 * Returns null if the user is not authenticated.
 */
export async function createBackendProxy(): Promise<BackendProxy | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;
    return new BackendProxy(token);
}
