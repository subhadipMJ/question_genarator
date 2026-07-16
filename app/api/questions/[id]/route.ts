import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { updateQuestion } from "../../../services/questions";

type RouteContext = {
    params: Promise<{ id: string }>;
};

type UpdateQuestionRequest = {
    question?: string;
    is_active?: boolean;
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

        const updatedQuestion = await updateQuestion(questionId, {
            question: body.question,
            is_active: body.is_active,
        });

        return NextResponse.json(updatedQuestion);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unable to update question.";
        const status = message === "AUTH_REQUIRED" ? 401 : 500;
        return NextResponse.json({ message }, { status });
    }
}
