import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "../../../lib/api-url";

type LoginResponse = {
    message: string;
    access_token: string;
    expires_in: number;
    user: {
        name: string;
        role: number;
        organization_name?: string;
        organization?: { name?: string } | string;
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
        nextResponse.cookies.set("access_token", loginResult.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: loginResult.expires_in,
        });
        nextResponse.cookies.set("user_name", loginResult.user.name, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: loginResult.expires_in,
        });
        nextResponse.cookies.set("user_role", String(loginResult.user.role), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: loginResult.expires_in,
        });
        const organizationName = getOrganizationName(loginResult.user);
        if (organizationName) {
            nextResponse.cookies.set("organization_name", organizationName, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: loginResult.expires_in,
            });
        }

        return nextResponse;
    } catch (error: unknown) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Unable to log in." },
            { status: 500 },
        );
    }
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
