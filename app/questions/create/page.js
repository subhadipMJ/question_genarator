import Link from "next/link";
import QuestionForm from "./question-form";

export default function CreateQuestionPage() {
    return (
        <main className="mx-auto w-full max-w-3xl p-6">
            <Link href="/questions" className="text-sm underline">
                Back to questions
            </Link>
            <h1 className="my-6 text-3xl font-bold">Create question</h1>
            <QuestionForm />
        </main>
    );
}
