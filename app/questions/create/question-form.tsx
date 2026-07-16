"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Topic } from "../../services/topics";

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
    const [marks, setMarks] = useState("1");
    const [isActive, setIsActive] = useState(true);
    const [options, setOptions] = useState<QuestionOption[]>([
        { ...EMPTY_OPTION, is_correct: true },
        { ...EMPTY_OPTION },
    ]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Topic states
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopicId, setSelectedTopicId] = useState<string>("");

    // Quick Create Topic states
    const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
    const [newTopicName, setNewTopicName] = useState("");
    const [newTopicColor, setNewTopicColor] = useState("#3b82f6");
    const [isCreatingTopic, setIsCreatingTopic] = useState(false);

    useEffect(() => {
        async function loadTopics() {
            try {
                const res = await fetch("/api/backend/topics/");
                if (res.ok) {
                    const data = await res.json();
                    setTopics(data);
                }
            } catch (err) {
                console.error("Failed to load topics", err);
            }
        }
        loadTopics();
    }, []);

    async function handleQuickCreateTopic(e: React.FormEvent) {
        e.preventDefault();
        if (!newTopicName.trim()) return;
        setIsCreatingTopic(true);
        try {
            const res = await fetch("/api/backend/topics/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTopicName.trim(), color: newTopicColor, is_active: true }),
            });
            const created = await res.json();
            if (!res.ok) throw new Error(created.detail ?? "Failed to create topic.");
            setTopics((current) => [...current, created]);
            setSelectedTopicId(String(created.id));
            setNewTopicName("");
            setIsQuickCreateOpen(false);
            toast.success("Topic created successfully!");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to create topic.");
        } finally {
            setIsCreatingTopic(false);
        }
    }

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

        if (!Number.isFinite(Number(marks)) || Number(marks) <= 0) {
            setError("Marks must be greater than zero.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question,
                    marks,
                    is_active: isActive,
                    topic_id: selectedTopicId ? Number(selectedTopicId) : null,
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
        <>
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

            <div className="max-w-md space-y-2">
                <Label htmlFor="topic">Topic (Optional)</Label>
                <div className="flex gap-2">
                    <select
                        id="topic"
                        value={selectedTopicId}
                        onChange={(e) => setSelectedTopicId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">No topic</option>
                        {topics.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                    <Button type="button" variant="outline" onClick={() => setIsQuickCreateOpen(true)}>
                        New
                    </Button>
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

        {isQuickCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <Card className="w-full max-w-sm animate-in fade-in-50 zoom-in-95 duration-150">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Quick Create Topic</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleQuickCreateTopic} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-topic-name">Topic Name</Label>
                                <Input
                                    id="new-topic-name"
                                    value={newTopicName}
                                    onChange={(e) => setNewTopicName(e.target.value)}
                                    placeholder="e.g. Science, React"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-topic-color">Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="new-topic-color"
                                        type="color"
                                        value={newTopicColor}
                                        onChange={(e) => setNewTopicColor(e.target.value)}
                                        className="w-12 h-10 p-0.5 cursor-pointer shrink-0"
                                    />
                                    <Input
                                        type="text"
                                        value={newTopicColor}
                                        onChange={(e) => setNewTopicColor(e.target.value)}
                                        className="font-mono text-sm uppercase"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsQuickCreateOpen(false)}
                                    disabled={isCreatingTopic}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isCreatingTopic}>
                                    {isCreatingTopic ? "Creating..." : "Create"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )}
        </>
    );
}
