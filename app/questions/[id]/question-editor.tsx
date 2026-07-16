"use client";

import dynamic from "next/dynamic";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import type { Question } from "../../services/questions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => <div className="bg-muted h-40 animate-pulse rounded" />,
});

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

export default function QuestionEditor({ question: initialQuestion }: { question: Question }) {
    const [question, setQuestion] = useState(initialQuestion.question ?? initialQuestion.title ?? "");
    const [marks, setMarks] = useState(initialQuestion.marks);
    const [isActive, setIsActive] = useState(initialQuestion.is_active);
    const [options, setOptions] = useState(
        (initialQuestion.options ?? []).map(({ ans, is_correct }) => ({ ans, is_correct })),
    );
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!question.replace(/<[^>]*>/g, "").trim() || options.some((option) => !option.ans.trim())) {
            setError("Enter the question and complete every option.");
            return;
        }

        if (options.length < 2) {
            setError("Add at least two answer options.");
            return;
        }


        if (!Number.isFinite(Number(marks)) || Number(marks) <= 0) {
            setError("Marks must be greater than zero.");
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch(`/api/questions/${initialQuestion.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question,
                    marks,
                    is_active: isActive,
                    options: options.map((option) => ({
                        ans: option.ans.trim(),
                        is_correct: option.is_correct,
                    })),
                }),
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message ?? "Unable to save question.");
            toast.success("Question saved successfully.");
        } catch (saveError: unknown) {
            setError(saveError instanceof Error ? saveError.message : "Unable to save question.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="max-w-40 space-y-2">
                <Label htmlFor="marks">Marks</Label>
                <Input
                    id="marks"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={marks}
                    onChange={(event) => setMarks(event.target.value)}
                />
            </div>

            <fieldset className="space-y-3">
                <legend className="mb-2 font-medium">Answer options</legend>
                <RadioGroup
                    value={String(options.findIndex((option) => option.is_correct))}
                    onValueChange={(value) => setOptions((current) => current.map((option, index) => ({
                        ...option,
                        is_correct: index === Number(value),
                    })))}
                >
                    {options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <RadioGroupItem value={String(index)} aria-label={`Mark option ${index + 1} as correct`} />
                            <Input
                                value={option.ans}
                                onChange={(event) => setOptions((current) => current.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, ans: event.target.value } : item,
                                ))}
                                placeholder={`Option ${index + 1}`}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-destructive"
                                disabled={options.length <= 2}
                                onClick={() => setOptions((current) => {
                                    const remaining = current.filter((_, itemIndex) => itemIndex !== index);
                                    if (!remaining.some((item) => item.is_correct) && remaining[0]) {
                                        remaining[0] = { ...remaining[0], is_correct: true };
                                    }
                                    return remaining;
                                })}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                </RadioGroup>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOptions((current) => [
                        ...current,
                        { ans: "", is_correct: current.length === 0 },
                    ])}
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
                disabled={isSaving}
            >
                {isSaving ? "Saving..." : "Save question"}
            </Button>
        </form>
    );
}
