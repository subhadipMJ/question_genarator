import { NextResponse } from "next/server";
import {
    createQuestion,
    createQuestionOption,
} from "../../services/questions";

export async function POST(request) {
    try {
        const { question, is_active = true, options } = await request.json();

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
    } catch (error) {
        return NextResponse.json(
            { message: error.message || "Unable to create question." },
            { status: 500 },
        );
    }
}
