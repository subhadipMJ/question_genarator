import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import { getAllQuestions } from "../services/questions";

export default async function QuestionsPage() {
    const questions = await getAllQuestions();

    return (
        <main className="p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">All Questions</h1>
                <Link
                    href="/questions/create"
                    className="rounded-lg bg-black px-4 py-2 text-white"
                >
                    Create question
                </Link>
            </div>

            <div className="space-y-3">
                {questions.map((item) => (
                    <Link
                        key={item.id}
                        href={`/questions/${item.id}`}
                        className="block rounded-lg border p-4 hover:bg-gray-600"
                    >
                        <div
                            className="font-semibold"
                            dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(item.question ?? item.title ?? "", {
                                    allowedTags: [
                                        ...sanitizeHtml.defaults.allowedTags,
                                        "sub",
                                        "sup",
                                    ],
                                }),
                            }}
                        />

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
