"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { Topic } from "../../services/topics";
import { DictationButton } from "@/components/ui/dictation-button";

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
    const quillRef = useRef<any>(null);

    const handleDictation = (text: string) => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
            const selection = editor.getSelection();
            const cursorPosition = selection ? selection.index : editor.getLength() - 1;
            editor.insertText(cursorPosition, text + " ");
            editor.setSelection(cursorPosition + text.length + 1);
        } else {
            setQuestion((prev) => prev + " " + text);
        }
    };

    // Multiple Diagram upload states
    const [diagramFiles, setDiagramFiles] = useState<File[]>([]);
    const [diagramPreviews, setDiagramPreviews] = useState<string[]>([]);

    // Option Diagram upload states
    const [optionDiagramFiles, setOptionDiagramFiles] = useState<Record<number, File | null>>({});
    const [optionDiagramPreviews, setOptionDiagramPreviews] = useState<Record<number, string | null>>({});

    function handleOptionFileChange(index: number, file: File | null) {
        setOptionDiagramFiles((prev) => ({ ...prev, [index]: file }));
        if (file) {
            setOptionDiagramPreviews((prev) => ({ ...prev, [index]: URL.createObjectURL(file) }));
        } else {
            setOptionDiagramPreviews((prev) => ({ ...prev, [index]: null }));
        }
    }

    function handleFileChange(files: FileList | null) {
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files);
        setDiagramFiles((prev) => [...prev, ...newFiles]);
        const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
        setDiagramPreviews((prev) => [...prev, ...newPreviews]);
    }

    function removeDiagramFile(index: number) {
        setDiagramFiles((prev) => prev.filter((_, i) => i !== index));
        setDiagramPreviews((prev) => prev.filter((_, i) => i !== index));
    }

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
        const isOptionValid = (option: QuestionOption, index: number) => {
            return option.ans.trim().length > 0 || !!optionDiagramFiles[index];
        };

        if (!plainQuestion || options.some((option, index) => !isOptionValid(option, index))) {
            setError("An option text can only be left empty if an option diagram image is attached.");
            return;
        }

        if (options.length < 2) {
            setError("Add at least two answer options.");
            return;
        }

        if (options.length > 5) {
            setError("You can add a maximum of 5 answer options.");
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

            if (diagramFiles.length > 0) {
                try {
                    for (const file of diagramFiles) {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("type", "0");
                        formData.append("ref_id", String(result.id));
                        formData.append("org_id", "0");

                        const diagRes = await fetch("/api/backend/diagrams/upload", {
                            method: "POST",
                            body: formData,
                        });

                        if (!diagRes.ok) {
                            const diagErr = await diagRes.json().catch(() => ({ detail: "Failed to upload diagram" }));
                            toast.error(`Failed to upload diagram ${file.name}: ${diagErr.detail || diagRes.statusText}`);
                        }
                    }
                } catch (diagError) {
                    console.error("Diagram upload failed:", diagError);
                    toast.error("Question created, but some diagrams failed to upload.");
                }
            }

            // Upload option diagrams (type = 1)
            if (result.options && Array.isArray(result.options)) {
                for (let i = 0; i < result.options.length; i++) {
                    const optFile = optionDiagramFiles[i];
                    const optId = result.options[i]?.id;
                    if (optFile && optId) {
                        try {
                            const optFormData = new FormData();
                            optFormData.append("file", optFile);
                            optFormData.append("type", "1"); // 1 = Option diagram
                            optFormData.append("ref_id", String(optId));
                            optFormData.append("org_id", "0");

                            await fetch("/api/backend/diagrams/upload", {
                                method: "POST",
                                body: optFormData,
                            });
                        } catch (optDiagErr) {
                            console.error(`Option ${i + 1} diagram upload failed:`, optDiagErr);
                        }
                    }
                }
            }

            toast.success("Question created successfully!");
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
                <div className="relative overflow-hidden rounded-lg bg-white text-black">
                    <div className="absolute top-1.5 right-1.5 z-10">
                        <DictationButton onResult={handleDictation} />
                    </div>
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={question}
                        onChange={setQuestion}
                        placeholder="Write your question..."
                        modules={QUILL_MODULES}
                        formats={QUILL_FORMATS}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="diagram-file" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Question Diagrams / Images (Optional - Upload Multiple)
                </Label>
                <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 bg-muted/20">
                    <Input
                        id="diagram-file"
                        type="file"
                        multiple
                        accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
                        onChange={(e) => handleFileChange(e.target.files)}
                        className="cursor-pointer max-w-sm"
                    />
                    {diagramPreviews.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-4">
                            {diagramPreviews.map((preview, index) => (
                                <div key={index} className="relative rounded-md border bg-background p-2.5 w-fit shadow-xs flex flex-col gap-2">
                                    <img
                                        src={preview}
                                        alt={`Diagram preview ${index + 1}`}
                                        className="max-h-44 max-w-full rounded object-contain bg-muted/10 p-1"
                                    />
                                    <div className="pt-2 border-t flex items-center justify-between gap-2">
                                        <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                                            {diagramFiles[index]?.name}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeDiagramFile(index)}
                                            className="h-7 px-2 text-xs"
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" /> Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                    <div key={index} className="flex flex-col gap-2 rounded-lg border p-3 bg-card">
                        <div className="flex items-center gap-3">
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

                        {/* Option Diagram attachment */}
                        <div className="flex items-center gap-3 pl-7">
                            <Label htmlFor={`option-file-${index}`} className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer hover:text-foreground">
                                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                                {optionDiagramFiles[index] ? "Change Option Diagram" : "Attach Option Diagram (Optional)"}
                            </Label>
                            <input
                                id={`option-file-${index}`}
                                type="file"
                                accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
                                className="hidden"
                                onChange={(e) => handleOptionFileChange(index, e.target.files?.[0] || null)}
                            />
                            {optionDiagramFiles[index] && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOptionFileChange(index, null)}
                                    className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
                                >
                                    <X className="h-3 w-3 mr-1" /> Clear
                                </Button>
                            )}
                        </div>

                        {optionDiagramPreviews[index] && (
                            <div className="pl-7 mt-1">
                                <div className="rounded border bg-background p-2 w-fit">
                                    <img
                                        src={optionDiagramPreviews[index]!}
                                        alt={`Option ${index + 1} diagram preview`}
                                        className="max-h-32 max-w-full rounded object-contain bg-muted/10 p-1"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                </RadioGroup>

                <Button
                    variant="outline"
                    type="button"
                    onClick={() => setOptions((current) => [...current, { ...EMPTY_OPTION }])}
                    disabled={options.length >= 5}
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
