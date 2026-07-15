import Link from "next/link";
import { getAllQuestions } from "../services/questions";

export default async function QuestionsPage() {
    const questions = await getAllQuestions();

    return (
        <main className="p-6">
            <h1 className="mb-6 text-2xl font-bold">All Questions</h1>

            <div className="space-y-3">
                {questions.map((item) => (
                    <Link
                        key={item.id}
                        href={`/questions/${item.id}`}
                        className="block rounded-lg border p-4 hover:bg-gray-600"
                    >
                        <h2 className="font-semibold">{item.question ?? item.title}</h2>

                        {item.options?.length > 0 && (
                            <ul className="mt-3 list-inside list-disc space-y-1">
                                {item.options.map((option) => (
                                    <li key={option.id}>{option.ans}</li>
                                ))}
                            </ul>
                        )}
                    </Link>
                ))}
            </div>
        </main>
    );
}
