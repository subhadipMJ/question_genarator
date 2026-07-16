import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "../../../lib/api-url";

type LoginResponse = {
    message: string;
    access_token: string;
    expires_in: number;
    organization_id: number | null;
    organization_name: string | null;
    user_role: number;
    user: {
        id: number;
        name: string;
        role: number;
        organization_id?: number;
        organization_name?: string;
        organization?: { id?: number; name?: string } | string;
    };
};

type ApiError = {
    detail?: string | Array<{ msg: string }>;
};

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required." },
                { status: 400 },
            );
        }

        const response = await fetch(getLoginUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password }),
            cache: "no-store",
        });
        const result = await response.json().catch(() => null) as LoginResponse | ApiError | null;

        if (!response.ok) {
            return NextResponse.json(
                { message: getErrorMessage(result) },
                { status: response.status },
            );
        }

        const loginResult = result as LoginResponse;
        const nextResponse = NextResponse.json({
            message: loginResult.message,
            user: loginResult.user,
        });
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/",
            maxAge: loginResult.expires_in,
        };

        nextResponse.cookies.set("access_token", loginResult.access_token, cookieOptions);
        nextResponse.cookies.set("user_id", String(loginResult.user.id), cookieOptions);
        nextResponse.cookies.set("user_name", loginResult.user.name, cookieOptions);
        nextResponse.cookies.set("user_role", String(loginResult.user_role ?? loginResult.user.role), cookieOptions);
        nextResponse.cookies.delete("organization_id");
        nextResponse.cookies.delete("organization_name");

        const organizationId = loginResult.organization_id ?? getOrganizationId(loginResult.user);
        if (organizationId !== null) {
            nextResponse.cookies.set("organization_id", String(organizationId), cookieOptions);
        }

        const organizationName = loginResult.organization_name ?? getOrganizationName(loginResult.user);
        if (organizationName) {
            nextResponse.cookies.set("organization_name", organizationName, cookieOptions);
        }

        return nextResponse;
    } catch (error: unknown) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Unable to log in." },
            { status: 500 },
        );
    }
}

function getOrganizationId(user: LoginResponse["user"]): number | null {
    if (Number.isInteger(user.organization_id)) return user.organization_id ?? null;
    if (user.organization && typeof user.organization === "object" && Number.isInteger(user.organization.id)) {
        return user.organization.id ?? null;
    }
    return null;
}

function getOrganizationName(user: LoginResponse["user"]): string | null {
    if (typeof user.organization_name === "string") return user.organization_name;
    if (typeof user.organization === "string") return user.organization;
    if (user.organization && typeof user.organization.name === "string") {
        return user.organization.name;
    }
    return null;
}

function getLoginUrl() {
    return getApiUrl("auth/login");
}

function getErrorMessage(result: LoginResponse | ApiError | null): string {
    if (result && "detail" in result && typeof result.detail === "string") {
        return result.detail;
    }
    if (result && "detail" in result && Array.isArray(result.detail)) {
        return result.detail.map((item: { msg: string }) => item.msg).join(" ");
    }
    return "Invalid email or password.";
}
