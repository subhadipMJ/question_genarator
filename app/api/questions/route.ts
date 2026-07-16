import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    createQuestion,
    createQuestionOption,
} from "../../services/questions";

type CreateQuestionRequest = {
    question: string;
    is_active?: boolean;
    options: Array<{ ans: string; is_correct: boolean }>;
};

export async function POST(request: NextRequest) {
    try {
        if (!(await cookies()).has("access_token")) {
            return NextResponse.json({ message: "Please sign in." }, { status: 401 });
        }

        const { question, is_active = true, options } = await request.json() as CreateQuestionRequest;

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

        const createdQuestion = await createQuestion({ question, is_active });

        await Promise.all(
            options.map((option) =>
                createQuestionOption(createdQuestion.id, option),
            ),
        );

        return NextResponse.json(createdQuestion, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unable to create question.";
        const status = message === "AUTH_REQUIRED" ? 401 : 500;
        return NextResponse.json(
            { message },
            { status },
        );
    }
}
