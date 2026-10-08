import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createBackendProxy, unauthorizedResponse, errorResponse } from "../../lib/backend-proxy";
import {
    createQuestion,
    createQuestionOption,
} from "../../services/questions";

export async function GET(request: NextRequest) {
    try {
        const proxy = await createBackendProxy();
        if (!proxy) return unauthorizedResponse();

        const cookieStore = await cookies();
        const role = cookieStore.get("user_role")?.value;
        const orgId = cookieStore.get("organization_id")?.value;
        const userId = cookieStore.get("user_id")?.value;

        const searchParams = new URLSearchParams(request.nextUrl.searchParams);
        if (role === "1" && orgId && !searchParams.has("organization_id")) {
            searchParams.set("organization_id", orgId);
        } else if (role === "2" && userId && !searchParams.has("question_user_id")) {
            searchParams.set("question_user_id", userId);
        }

        return proxy.forward("questions/", { searchParams });
    } catch {
        return errorResponse("Failed to fetch questions.");
    }
}

type CreateQuestionRequest = {
    question: string;
    marks?: string | number;
    is_active?: boolean;
    topic_id?: number | null;
    options: Array<{ ans: string; is_correct: boolean }>;
};

export async function POST(request: NextRequest) {
    try {
        if (!(await cookies()).has("access_token")) {
            return NextResponse.json({ message: "Please sign in." }, { status: 401 });
        }

        const { question, marks = "1", is_active = true, topic_id = null, options } = await request.json() as CreateQuestionRequest;

        if (!question || !Array.isArray(options) || options.length < 2) {
            return NextResponse.json(
                { message: "A question and at least two options are required." },
                { status: 400 },
            );
        }

        if (!options.some((option) => option.is_correct)) {
            return NextResponse.json(
                { message: "Select one correct option." },
                { status: 400 },
            );
        }

        if (!Number.isFinite(Number(marks)) || Number(marks) <= 0) {
            return NextResponse.json(
                { message: "Marks must be greater than zero." },
                { status: 400 },
            );
        }

        const createdQuestion = await createQuestion({ question, marks: String(marks), is_active, topic_id });

        const createdOptions = await Promise.all(
            options.map((option) =>
                createQuestionOption(createdQuestion.id, option),
            ),
        );

        return NextResponse.json({ ...createdQuestion, options: createdOptions }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unable to create question.";
        const status = message === "AUTH_REQUIRED" ? 401 : 500;
        return NextResponse.json(
            { message },
            { status },
        );
    }
}
