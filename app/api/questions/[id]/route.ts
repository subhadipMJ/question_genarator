import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { updateQuestion } from "../../../services/questions";

type RouteContext = {
    params: Promise<{ id: string }>;
};

type UpdateQuestionRequest = {
    question?: string;
    marks?: string | number;
    is_active?: boolean;
    topic_id?: number | null;
    options?: Array<{ ans: string; is_correct: boolean }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        if (!(await cookies()).has("access_token")) {
            return NextResponse.json({ message: "Please sign in." }, { status: 401 });
        }

        const { id } = await params;
        const questionId = Number(id);
        const body = await request.json() as UpdateQuestionRequest;

        if (!Number.isInteger(questionId) || questionId < 1) {
            return NextResponse.json({ message: "Invalid question ID." }, { status: 400 });
        }

        if (typeof body.question !== "string" || !body.question.replace(/<[^>]*>/g, "").trim()) {
            return NextResponse.json({ message: "Question text is required." }, { status: 400 });
        }

        if (!Number.isFinite(Number(body.marks)) || Number(body.marks) <= 0) {
            return NextResponse.json({ message: "Marks must be greater than zero." }, { status: 400 });
        }

        if (!Array.isArray(body.options) || body.options.length < 2) {
            return NextResponse.json({ message: "At least two answer options are required." }, { status: 400 });
        }

        const options = body.options.map((option) => ({
            ans: typeof option.ans === "string" ? option.ans.trim() : "",
            is_correct: option.is_correct === true,
        }));

        if (options.some((option) => !option.ans)) {
            return NextResponse.json({ message: "Complete every answer option." }, { status: 400 });
        }

        if (options.filter((option) => option.is_correct).length !== 1) {
            return NextResponse.json({ message: "Select exactly one correct option." }, { status: 400 });
        }

        const updatedQuestion = await updateQuestion(questionId, {
            question: body.question,
            marks: String(body.marks),
            is_active: body.is_active,
            topic_id: body.topic_id,
            options,
        });

        return NextResponse.json(updatedQuestion);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unable to update question.";
        const status = message === "AUTH_REQUIRED" ? 401 : 500;
        return NextResponse.json({ message }, { status });
    }
}
