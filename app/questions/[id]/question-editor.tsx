"use client";

import dynamic from "next/dynamic";
import { FormEvent, useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Trash2 } from "lucide-react";
import type { Question, DiagramItem } from "../../services/questions";
import { Topic } from "../../services/topics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DictationButton } from "@/components/ui/dictation-button";

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

    // Initial diagrams list setup
    const initialDiagramList = useMemo(() => {
        if (initialQuestion.diagrams && initialQuestion.diagrams.length > 0) {
            return initialQuestion.diagrams;
        }
        if (initialQuestion.diagram_path) {
            return [{ id: initialQuestion.diagram_id || 0, path: initialQuestion.diagram_path }] as DiagramItem[];
        }
        return [];
    }, [initialQuestion]);

    const [currentDiagrams, setCurrentDiagrams] = useState<DiagramItem[]>(initialDiagramList);
    const [deletingDiagId, setDeletingDiagId] = useState<number | null>(null);

    // Topic states
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopicId, setSelectedTopicId] = useState<string>(initialQuestion.topic_id ? String(initialQuestion.topic_id) : "");

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

    // New diagram upload states
    const [newDiagramFiles, setNewDiagramFiles] = useState<File[]>([]);
    const [newDiagramPreviews, setNewDiagramPreviews] = useState<string[]>([]);

    // Option Diagram states
    const initialOptionDiagrams = useMemo(() => {
        const map: Record<number, { id: number; path: string } | null> = {};
        (initialQuestion.options ?? []).forEach((opt, index) => {
            if (opt.diagram_path && opt.diagram_id) {
                map[index] = { id: opt.diagram_id, path: opt.diagram_path };
            } else {
                map[index] = null;
            }
        });
        return map;
    }, [initialQuestion]);

    const [currentOptionDiagrams, setCurrentOptionDiagrams] = useState(initialOptionDiagrams);
    const [optionDiagramFiles, setOptionDiagramFiles] = useState<Record<number, File | null>>({});
    const [optionDiagramPreviews, setOptionDiagramPreviews] = useState<Record<number, string | null>>({});
    const [deletingOptionDiagId, setDeletingOptionDiagId] = useState<number | null>(null);

    function handleOptionFileChange(index: number, file: File | null) {
        setOptionDiagramFiles((prev) => ({ ...prev, [index]: file }));
        if (file) {
            setOptionDiagramPreviews((prev) => ({ ...prev, [index]: URL.createObjectURL(file) }));
        } else {
            setOptionDiagramPreviews((prev) => ({ ...prev, [index]: null }));
        }
    }

    async function handleDeleteOptionDiagram(index: number, diagId: number) {
        if (!diagId) return;
        if (!window.confirm("Permanently delete this option diagram image? This action cannot be undone.")) return;

        setDeletingOptionDiagId(diagId);
        try {
            const res = await fetch(`/api/backend/diagrams/${diagId}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: "Failed to delete option diagram" }));
                throw new Error(err.detail || "Unable to delete option diagram");
            }
            setCurrentOptionDiagrams((prev) => ({ ...prev, [index]: null }));
            toast.success("Option diagram deleted successfully!");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to delete option diagram");
        } finally {
            setDeletingOptionDiagId(null);
        }
    }

    function handleFileChange(files: FileList | null) {
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files);
        setNewDiagramFiles((prev) => [...prev, ...newFiles]);
        const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
        setNewDiagramPreviews((prev) => [...prev, ...newPreviews]);
    }

    function removeNewDiagramFile(index: number) {
        setNewDiagramFiles((prev) => prev.filter((_, i) => i !== index));
        setNewDiagramPreviews((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleDeleteDiagram(diagId: number) {
        if (!diagId) return;
        if (!window.confirm("Permanently delete this diagram image? This action cannot be undone.")) return;

        setDeletingDiagId(diagId);
        try {
            const res = await fetch(`/api/backend/diagrams/${diagId}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: "Failed to delete diagram" }));
                throw new Error(err.detail || "Unable to delete diagram");
            }
            setCurrentDiagrams((prev) => prev.filter((d) => d.id !== diagId));
            toast.success("Diagram deleted successfully!");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to delete diagram");
        } finally {
            setDeletingDiagId(null);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        const isOptionValid = (option: { ans: string }, index: number) => {
            return (
                option.ans.trim().length > 0 ||
                !!optionDiagramFiles[index] ||
                !!currentOptionDiagrams[index]
            );
        };

        if (!question.replace(/<[^>]*>/g, "").trim() || options.some((option, index) => !isOptionValid(option, index))) {
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

        setIsSaving(true);

        try {
            const response = await fetch(`/api/questions/${initialQuestion.id}`, {
                method: "PATCH",
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

            const updatedResult = await response.json();
            if (!response.ok) {
                throw new Error(updatedResult.message ?? "Unable to update question.");
            }

            if (newDiagramFiles.length > 0) {
                try {
                    for (const file of newDiagramFiles) {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("type", "0");
                        formData.append("ref_id", String(initialQuestion.id));
                        formData.append("org_id", "0");

                        const diagRes = await fetch("/api/backend/diagrams/upload", {
                            method: "POST",
                            body: formData,
                        });

                        if (diagRes.ok) {
                            const uploadedDiag = await diagRes.json();
                            setCurrentDiagrams((prev) => [...prev, uploadedDiag]);
                        } else {
                            toast.error(`Failed to upload diagram ${file.name}`);
                        }
                    }
                    setNewDiagramFiles([]);
                    setNewDiagramPreviews([]);
                } catch (diagError) {
                    console.error("Diagram upload failed:", diagError);
                    toast.error("Question updated, but some new diagrams failed to upload.");
                }
            }

            // Upload option diagrams (type = 1)
            if (updatedResult.options && Array.isArray(updatedResult.options)) {
                for (let i = 0; i < updatedResult.options.length; i++) {
                    const optFile = optionDiagramFiles[i];
                    const optId = updatedResult.options[i]?.id;
                    if (optFile && optId) {
                        try {
                            const optFormData = new FormData();
                            optFormData.append("file", optFile);
                            optFormData.append("type", "1"); // 1 = Option diagram
                            optFormData.append("ref_id", String(optId));
                            optFormData.append("org_id", "0");

                            const optDiagRes = await fetch("/api/backend/diagrams/upload", {
                                method: "POST",
                                body: optFormData,
                            });
                            if (optDiagRes.ok) {
                                const uploadedOptDiag = await optDiagRes.json();
                                setCurrentOptionDiagrams((prev) => ({
                                    ...prev,
                                    [i]: { id: uploadedOptDiag.id, path: uploadedOptDiag.path },
                                }));
                            }
                        } catch (optDiagErr) {
                            console.error(`Option ${i + 1} diagram upload failed:`, optDiagErr);
                        }
                    }
                }
                setOptionDiagramFiles({});
                setOptionDiagramPreviews({});
            }

            toast.success("Question updated successfully!");
        } catch (submissionError: unknown) {
            setError(submissionError instanceof Error ? submissionError.message : "Unable to update question.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-6">
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

            {currentDiagrams.length > 0 && (
                <div className="space-y-3">
                    <Label className="flex items-center gap-2 font-medium">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        Attached Question Diagrams ({currentDiagrams.length})
                    </Label>
                    <div className="flex flex-wrap gap-4">
                        {currentDiagrams.map((diag) => (
                            <div key={diag.id} className="flex flex-col gap-2 rounded-lg border p-3 bg-card w-fit shadow-xs">
                                <img
                                    src={`/api/backend/${diag.path}`}
                                    alt={`Question Diagram #${diag.id}`}
                                    className="max-h-60 max-w-full rounded object-contain bg-muted/10 p-1"
                                />
                                <div className="pt-2 border-t flex justify-end">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteDiagram(diag.id)}
                                        disabled={deletingDiagId === diag.id}
                                    >
                                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                        {deletingDiagId === diag.id ? "Deleting..." : "Delete Diagram"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="diagram-file-edit" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Upload Additional Question Diagrams (Optional)
                </Label>
                <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 bg-muted/20">
                    <Input
                        id="diagram-file-edit"
                        type="file"
                        multiple
                        accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
                        onChange={(e) => handleFileChange(e.target.files)}
                        className="cursor-pointer max-w-sm"
                    />
                    {newDiagramPreviews.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-4">
                            {newDiagramPreviews.map((preview, index) => (
                                <div key={index} className="relative rounded-md border bg-background p-2.5 w-fit shadow-xs flex flex-col gap-2">
                                    <img
                                        src={preview}
                                        alt={`New diagram preview ${index + 1}`}
                                        className="max-h-44 max-w-full rounded object-contain bg-muted/10 p-1"
                                    />
                                    <div className="pt-2 border-t flex items-center justify-between gap-2">
                                        <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                                            {newDiagramFiles[index]?.name}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeNewDiagramFile(index)}
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
                <RadioGroup
                    value={String(options.findIndex((option) => option.is_correct))}
                    onValueChange={(value) => setOptions((current) => current.map((option, index) => ({
                        ...option,
                        is_correct: index === Number(value),
                    })))}
                >
                    {options.map((option, index) => (
                        <div key={index} className="flex flex-col gap-2 rounded-lg border p-3 bg-card">
                            <div className="flex items-center gap-3">
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

                            {/* Current Option Diagram display */}
                            {currentOptionDiagrams[index] && !optionDiagramPreviews[index] && (
                                <div className="pl-7 mt-1 flex flex-col gap-2 w-fit">
                                    <div className="rounded border bg-background p-2 w-fit shadow-xs">
                                        <img
                                            src={`/api/backend/${currentOptionDiagrams[index]!.path}`}
                                            alt={`Option ${index + 1} Diagram`}
                                            className="max-h-40 max-w-full rounded object-contain bg-muted/10 p-1"
                                        />
                                        <div className="pt-2 border-t flex justify-end">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteOptionDiagram(index, currentOptionDiagrams[index]!.id)}
                                                disabled={deletingOptionDiagId === currentOptionDiagrams[index]!.id}
                                                className="h-7 px-2 text-xs"
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                {deletingOptionDiagId === currentOptionDiagrams[index]!.id ? "Deleting..." : "Delete Diagram"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Option Diagram File Attachment */}
                            <div className="flex items-center gap-3 pl-7">
                                <Label htmlFor={`option-file-edit-${index}`} className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer hover:text-foreground">
                                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                                    {currentOptionDiagrams[index] ? "Replace Option Diagram" : optionDiagramFiles[index] ? "Change Selected Image" : "Attach Option Diagram (Optional)"}
                                </Label>
                                <input
                                    id={`option-file-edit-${index}`}
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
                                            className="max-h-36 max-w-full rounded object-contain bg-muted/10 p-1"
                                        />
                                    </div>
                                </div>
                            )}
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
                disabled={isSaving}
            >
                {isSaving ? "Saving..." : "Save question"}
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
