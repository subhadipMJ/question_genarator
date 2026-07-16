"use client";

import dynamic from "next/dynamic";
import { FormEvent, useState } from "react";
import type { Question } from "../../services/questions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
    const [isActive, setIsActive] = useState(initialQuestion.is_active);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!question.replace(/<[^>]*>/g, "").trim()) {
            setError("Enter the question before saving.");
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch(`/api/questions/${initialQuestion.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, is_active: isActive }),
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message ?? "Unable to save question.");
            setMessage("Question saved successfully.");
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

            {(initialQuestion.options?.length ?? 0) > 0 && (
                <fieldset className="space-y-2">
                    <legend className="mb-2 font-medium">Answer options</legend>
                    <RadioGroup value={String(initialQuestion.options?.findIndex((option) => option.is_correct))} disabled>
                    {initialQuestion.options?.map((option, index) => (
                        <div key={option.id ?? index} className="flex items-center gap-3 rounded-lg border p-3">
                            <RadioGroupItem value={String(index)} />
                            <span>{option.ans}</span>
                        </div>
                    ))}
                    </RadioGroup>
                </fieldset>
            )}

            <Label className="flex items-center gap-2">
                <Checkbox
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                Active question
            </Label>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}

            <Button
                type="submit"
                disabled={isSaving}
            >
                {isSaving ? "Saving..." : "Save question"}
            </Button>
        </form>
    );
}
