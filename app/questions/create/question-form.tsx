"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type QuestionOption = {
    ans: string;
    is_correct: boolean;
};

const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => <div className="bg-muted h-40 animate-pulse rounded" />,
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
                <Label className="mb-2">Question</Label>
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
                <RadioGroup value={String(options.findIndex((option) => option.is_correct))} onValueChange={(value) => selectCorrectOption(Number(value))}>
                {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <RadioGroupItem value={String(index)}
                            aria-label={`Mark option ${index + 1} as correct`}
                        />
                        <Input
                            type="text"
                            value={option.ans}
                            onChange={(event) => updateOption(index, event.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1"
                        />
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => removeOption(index)}
                            disabled={options.length <= 2}
                            className="text-destructive"
                        >
                            Remove
                        </Button>
                    </div>
                ))}
                </RadioGroup>

                <Button
                    variant="outline"
                    type="button"
                    onClick={() => setOptions((current) => [...current, { ...EMPTY_OPTION }])}
                >
                    Add option
                </Button>
            </fieldset>

            <Label className="flex items-center gap-2">
                <Checkbox
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                Active question
            </Label>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <Button
                type="submit"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Creating..." : "Create question"}
            </Button>
        </form>
    );
}
