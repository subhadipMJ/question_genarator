"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type QuestionOption = {
    ans: string;
    is_correct: boolean;
};

const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => <div className="h-40 animate-pulse rounded bg-gray-100" />,
});

const EMPTY_OPTION = { ans: "", is_correct: false };
const QUILL_MODULES = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ script: "sub" }, { script: "super" }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "clean"],
    ],
};

const QUILL_FORMATS = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "script",
    "list",
    "link",
];

export default function QuestionForm() {
    const router = useRouter();
    const [question, setQuestion] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [options, setOptions] = useState<QuestionOption[]>([
        { ...EMPTY_OPTION, is_correct: true },
        { ...EMPTY_OPTION },
    ]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    function updateOption(index: number, ans: string) {
        setOptions((current) =>
            current.map((option, optionIndex) =>
                optionIndex === index ? { ...option, ans } : option,
            ),
        );
    }

    function selectCorrectOption(index: number) {
        setOptions((current) =>
            current.map((option, optionIndex) => ({
                ...option,
                is_correct: optionIndex === index,
            })),
        );
    }

    function removeOption(index: number) {
        if (options.length <= 2) return;

        setOptions((current) => {
            const remaining = current.filter((_, optionIndex) => optionIndex !== index);
            if (!remaining.some((option) => option.is_correct)) {
                remaining[0] = { ...remaining[0], is_correct: true };
            }
            return remaining;
        });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        const plainQuestion = question.replace(/<[^>]*>/g, "").trim();
        if (!plainQuestion || options.some((option) => !option.ans.trim())) {
            setError("Enter the question and complete every option.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question,
                    is_active: isActive,
                    options: options.map((option) => ({
                        ans: option.ans.trim(),
                        is_correct: option.is_correct,
                    })),
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            router.push(`/questions/${result.id}`);
            router.refresh();
        } catch (submissionError: unknown) {
            setError(submissionError instanceof Error ? submissionError.message : "Unable to create question.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                <label className="mb-2 block font-medium">Question</label>
                <div className="overflow-hidden rounded-lg bg-white text-black">
                    <ReactQuill
                        theme="snow"
                        value={question}
                        onChange={setQuestion}
                        placeholder="Write your question..."
                        modules={QUILL_MODULES}
                        formats={QUILL_FORMATS}
                    />
                </div>
            </div>

            <fieldset className="space-y-3">
                <legend className="mb-2 font-medium">Answer options</legend>
                {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <input
                            type="radio"
                            name="correct-option"
                            checked={option.is_correct}
                            onChange={() => selectCorrectOption(index)}
                            aria-label={`Mark option ${index + 1} as correct`}
                        />
                        <input
                            type="text"
                            value={option.ans}
                            onChange={(event) => updateOption(index, event.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 rounded-lg border px-3 py-2"
                        />
                        <button
                            type="button"
                            onClick={() => removeOption(index)}
                            disabled={options.length <= 2}
                            className="rounded px-3 py-2 text-red-600 disabled:opacity-30"
                        >
                            Remove
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() => setOptions((current) => [...current, { ...EMPTY_OPTION }])}
                    className="rounded-lg border px-4 py-2"
                >
                    Add option
                </button>
            </fieldset>

            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                />
                Active question
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
            >
                {isSubmitting ? "Creating..." : "Create question"}
            </button>
        </form>
    );
}
