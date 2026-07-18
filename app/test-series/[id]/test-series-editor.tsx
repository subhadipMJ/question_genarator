"use client";

import { useState, useMemo, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import sanitizeHtml from "sanitize-html";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus, X, Search, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { TestSeries } from "../../services/test-series";
import type { Question } from "../../services/questions";
import type { Topic } from "../../services/topics";

const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => <div className="bg-muted h-32 animate-pulse rounded" />,
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

function formatDateTimeLocal(isoString?: string): string {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getApiError(data: unknown, status: number): string {
    if (data && typeof data === "object") {
        const v = data as { detail?: unknown; message?: unknown };
        if (typeof v.detail === "string") return v.detail;
        if (Array.isArray(v.detail)) {
            const msgs = v.detail.flatMap((i) =>
                i && typeof i === "object" && "msg" in i ? [String(i.msg)] : [],
            );
            if (msgs.length > 0) return msgs.join(", ");
        }
        if (typeof v.message === "string") return v.message;
    }
    return `Server returned error status ${status}`;
}

type TestSeriesEditorProps = {
    series: TestSeries;
    availableQuestions: Question[];
    topics: Topic[];
    userId: number;
    userRole?: string;
    userOrgId?: number;
};

export default function TestSeriesEditor({
    series,
    availableQuestions,
    topics,
    userId,
    userRole,
    userOrgId,
}: TestSeriesEditorProps) {
    const router = useRouter();
    const [localQuestions, setLocalQuestions] = useState<Question[]>(availableQuestions);
    const [linkedQuestionIds, setLinkedQuestionIds] = useState<number[]>(series.question_ids);

    // Form metadata states
    const [name, setName] = useState(series.name);
    const [accessType, setAccessType] = useState(series.access_type);
    const [validUntil, setValidUntil] = useState(series.valid_until);
    const [durationSeconds, setDurationSeconds] = useState(series.duration_seconds);
    const [busy, setBusy] = useState(false);
    const [newInviteToken, setNewInviteToken] = useState<string | null>(series.invite_token);
    const [origin, setOrigin] = useState("");

    // Modal / Drawer controls
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);

    // Filter controls for adding existing questions
    const [searchQuery, setSearchQuery] = useState("");
    const [topicFilter, setTopicFilter] = useState("");

    // Create question form states
    const [newQText, setNewQText] = useState("");
    const [newQMarks, setNewQMarks] = useState("1");
    const [newQTopicId, setNewQTopicId] = useState("");
    const [newQOptions, setNewQOptions] = useState([
        { ans: "", is_correct: true },
        { ans: "", is_correct: false },
        { ans: "", is_correct: false },
        { ans: "", is_correct: false },
    ]);
    const [createBusy, setCreateBusy] = useState(false);

    // Bulk upload states
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkJsonText, setBulkJsonText] = useState("");
    const [bulkFileLoading, setBulkFileLoading] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [bulkBusy, setBulkBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useMemo(() => {
        if (typeof window !== "undefined") setOrigin(window.location.origin);
    }, []);

    // Derived states
    const linkedQuestions = useMemo(() => {
        return linkedQuestionIds.flatMap((id) => {
            const q = localQuestions.find((item) => item.id === id);
            return q ? [q] : [];
        });
    }, [linkedQuestionIds, localQuestions]);

    const totalMarks = useMemo(() => {
        return linkedQuestions.reduce((sum, q) => sum + parseFloat(q.marks), 0);
    }, [linkedQuestions]);

    const searchableQuestions = useMemo(() => {
        let result = localQuestions;
        if (topicFilter) {
            result = result.filter((q) => q.topic_id === Number(topicFilter));
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((q) => {
                const plain = sanitizeHtml(q.question, { allowedTags: [] }).toLowerCase();
                return plain.includes(query) || String(q.id).includes(query);
            });
        }
        return result;
    }, [localQuestions, searchQuery, topicFilter]);

    function toggleQuestion(id: number) {
        setLinkedQuestionIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((item) => item !== id);
            } else {
                return [...prev, id];
            }
        });
    }

    // Position updates
    function moveUp(index: number) {
        if (index === 0) return;
        setLinkedQuestionIds((prev) => {
            const next = [...prev];
            const temp = next[index];
            next[index] = next[index - 1];
            next[index - 1] = temp;
            return next;
        });
    }

    function moveDown(index: number) {
        if (index === linkedQuestionIds.length - 1) return;
        setLinkedQuestionIds((prev) => {
            const next = [...prev];
            const temp = next[index];
            next[index] = next[index + 1];
            next[index + 1] = temp;
            return next;
        });
    }

    function removeQuestion(id: number) {
        setLinkedQuestionIds((prev) => prev.filter((item) => item !== id));
    }



    // Save full series
    async function handleSaveChanges(e: FormEvent) {
        e.preventDefault();
        const validUntilDate = new Date(validUntil);
        if (Number.isNaN(validUntilDate.getTime()) || validUntilDate.getTime() <= Date.now()) {
            toast.error("Valid until must be a future date and time.");
            return;
        }
        if (durationSeconds <= 0) {
            toast.error("Duration must be greater than zero.");
            return;
        }

        setBusy(true);
        try {
            const res = await fetch(`/api/backend/test-series/${series.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    access_type: accessType,
                    valid_until: validUntilDate.toISOString(),
                    duration_seconds: durationSeconds,
                    question_ids: linkedQuestionIds,
                    is_active: true,
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(getApiError(data, res.status));

            setNewInviteToken(data.invite_token ?? null);
            toast.success("Test series saved successfully!");
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Unable to save test series.");
        } finally {
            setBusy(false);
        }
    }

    // Create & Add Question Handler
    async function handleCreateQuestion(e: FormEvent) {
        e.preventDefault();
        const plainText = newQText.replace(/<[^>]*>/g, "").trim();
        if (!plainText || newQOptions.some((opt) => !opt.ans.trim())) {
            toast.error("Complete the question text and all option fields.");
            return;
        }
        const marksNum = Number(newQMarks);
        if (!Number.isFinite(marksNum) || marksNum <= 0) {
            toast.error("Marks must be greater than zero.");
            return;
        }

        setCreateBusy(true);
        try {
            const res = await fetch("/api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: newQText,
                    marks: marksNum,
                    is_active: true,
                    topic_id: newQTopicId ? Number(newQTopicId) : null,
                    options: newQOptions.map((opt) => ({
                        ans: opt.ans.trim(),
                        is_correct: opt.is_correct,
                    })),
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message ?? "Unable to create question.");

            // Append to local states
            setLocalQuestions((prev) => [...prev, result]);
            setLinkedQuestionIds((prev) => [...prev, result.id]);

            toast.success("New question created and added!");
            // Reset form
            setNewQText("");
            setNewQMarks("1");
            setNewQTopicId("");
            setNewQOptions([
                { ans: "", is_correct: true },
                { ans: "", is_correct: false },
                { ans: "", is_correct: false },
                { ans: "", is_correct: false },
            ]);
            setIsCreateModalOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Unable to create question.");
        } finally {
            setCreateBusy(false);
        }
    }

    const AI_PROMPT_TEMPLATE = `Generate a JSON array of multiple-choice questions for an online assessment in the exact format specified below.
Each question must be an object with the following schema:
- question: string (can contain basic HTML tags like <p>, <strong>, <sub>, <sup> for scientific/math formatting)
- marks: number (e.g., 1 or 2)
- is_active: true
- topic_id: number | null (the database ID of the topic, or null if not applicable)
- options: an array of exactly 4 options. Each option must have:
  - ans: string (the text of the answer option)
  - is_correct: boolean (exactly one option in the array must be true, the other three must be false)

Example Format:
[
  {
    "question": "<p>What is the chemical formula for water?</p>",
    "marks": 1,
    "is_active": true,
    "topic_id": 1,
    "options": [
      { "ans": "H2O", "is_correct": true },
      { "ans": "CO2", "is_correct": false },
      { "ans": "O2", "is_correct": false },
      { "ans": "H2", "is_correct": false }
    ]
  }
]

Please generate 5 high-quality questions. Respond with the raw JSON array ONLY. Do not write any markdown code blocks, explanation text, or introductions.`;

    function copyAiPrompt() {
        navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
        toast.success("AI Prompt template copied to clipboard! Paste it into ChatGPT.");
    }

    const BULK_TEMPLATE_EXAMPLE = JSON.stringify(
        [
            {
                question: "<p>Sample question text here...</p>",
                marks: 2,
                is_active: true,
                options: [
                    { ans: "Correct option answer", is_correct: true },
                    { ans: "Incorrect option answer A", is_correct: false },
                    { ans: "Incorrect option answer B", is_correct: false },
                    { ans: "Incorrect option answer C", is_correct: false }
                ]
            }
        ],
        null,
        2
    );

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setBulkFileLoading(true);
        setJsonError(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                // Try parsing to validate structure
                const parsed = JSON.parse(text);
                if (!Array.isArray(parsed)) throw new Error("JSON must be an array of questions.");
                setBulkJsonText(JSON.stringify(parsed, null, 2));
                toast.success("JSON file loaded successfully!");
            } catch (err) {
                setJsonError(err instanceof Error ? err.message : "Malformed JSON file.");
                toast.error("Malformed JSON file.");
            } finally {
                setBulkFileLoading(false);
            }
        };
        reader.onerror = () => {
            setJsonError("Failed to read file.");
            setBulkFileLoading(false);
        };
        reader.readAsText(file);
    }

    async function handleBulkUploadSubmit(e: FormEvent) {
        e.preventDefault();
        setJsonError(null);
        let parsedPayload: any[] = [];
        try {
            parsedPayload = JSON.parse(bulkJsonText);
            if (!Array.isArray(parsedPayload)) {
                throw new Error("JSON must be an array of questions.");
            }
            if (parsedPayload.length === 0) {
                throw new Error("JSON array cannot be empty.");
            }
            // Basic layout verification
            parsedPayload.forEach((item, idx) => {
                if (typeof item !== "object" || !item) {
                    throw new Error(`Item at index ${idx} is not an object.`);
                }
                const plainText = String(item.question ?? "").replace(/<[^>]*>/g, "").trim();
                if (!plainText) {
                    throw new Error(`Item at index ${idx} has no question text.`);
                }
                const mVal = Number(item.marks);
                if (!Number.isFinite(mVal) || mVal <= 0) {
                    throw new Error(`Item at index ${idx} has invalid marks (must be > 0).`);
                }
                if (!Array.isArray(item.options) || item.options.length < 2) {
                    throw new Error(`Item at index ${idx} must have at least 2 option items.`);
                }
                if (item.options.some((opt: any) => !String(opt.ans ?? "").trim())) {
                    throw new Error(`Item at index ${idx} has empty option text.`);
                }
                const correctCount = item.options.filter((opt: any) => opt.is_correct).length;
                if (correctCount !== 1) {
                    throw new Error(`Item at index ${idx} must have exactly one correct option.`);
                }
            });
        } catch (err) {
            setJsonError(err instanceof Error ? err.message : "Malformed JSON.");
            toast.error(err instanceof Error ? err.message : "Malformed JSON.");
            return;
        }

        setBulkBusy(true);
        try {
            const res = await fetch("/api/backend/questions/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    parsedPayload.map((item) => ({
                        question: String(item.question),
                        marks: Number(item.marks),
                        is_active: item.is_active !== false,
                        topic_id: item.topic_id ? Number(item.topic_id) : null,
                        options: item.options.map((opt: any) => ({
                            ans: String(opt.ans).trim(),
                            is_correct: !!opt.is_correct,
                        })),
                    }))
                ),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(getApiError(data, res.status));

            const resultList = data as Question[];
            // Append to local states
            setLocalQuestions((prev) => [...prev, ...resultList]);
            setLinkedQuestionIds((prev) => [...prev, ...resultList.map((q) => q.id)]);

            toast.success(`Successfully uploaded and linked ${resultList.length} questions!`);
            setIsBulkModalOpen(false);
            setBulkJsonText("");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Bulk upload failed.");
        } finally {
            setBulkBusy(false);
        }
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header / Nav */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/test-series" />}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Configure Series</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Manage details, questions, and ordering.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1 text-xs">
                        {linkedQuestionIds.length} question{linkedQuestionIds.length !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 text-xs">
                        {totalMarks.toFixed(2)} total marks
                    </Badge>
                </div>
            </div>

            {/* Invite Token Banner */}
            {newInviteToken && accessType === "invite_only" && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-4 animate-in fade-in duration-200">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">Invite link</p>
                        <code className="mt-1 block break-all text-xs text-muted-foreground">
                            {`${origin}/student/join#token=${newInviteToken}`}
                        </code>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            navigator.clipboard.writeText(`${origin}/student/join#token=${newInviteToken}`);
                            toast.success("Copied!");
                        }}
                    >
                        Copy link
                    </Button>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Side: Metadata Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Series Details</CardTitle>
                            <CardDescription>Configure core configuration fields.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveChanges} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="s-name">Series Name</Label>
                                    <Input
                                        id="s-name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Physics Final Exam"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="s-access">Access Type</Label>
                                    <select
                                        id="s-access"
                                        className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={accessType}
                                        onChange={(e) => setAccessType(e.target.value as "public" | "invite_only")}
                                    >
                                        <option value="public">Public — open to all</option>
                                        <option value="invite_only">Invite only — link required</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="s-valid">Valid Until</Label>
                                    <Input
                                        id="s-valid"
                                        type="datetime-local"
                                        required
                                        value={formatDateTimeLocal(validUntil)}
                                        onChange={(e) => setValidUntil(new Date(e.target.value).toISOString())}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="s-duration">Duration (minutes)</Label>
                                    <Input
                                        id="s-duration"
                                        type="number"
                                        min="1"
                                        required
                                        value={Math.round(durationSeconds / 60)}
                                        onChange={(e) => setDurationSeconds(Math.round(Number(e.target.value) * 60))}
                                    />
                                </div>

                                <div className="pt-4 border-t flex flex-col gap-2">
                                    <Button type="submit" className="w-full" disabled={busy}>
                                        {busy ? "Saving changes..." : "Save changes"}
                                    </Button>
                                    <Button variant="outline" className="w-full" nativeButton={false} render={<Link href="/test-series" />}>
                                        Back to list
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Questions Card */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="flex flex-col h-full min-h-[450px]">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle>Questions Checklist</CardTitle>
                                <CardDescription>Arrange and structure linked questions.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsAddPanelOpen((prev) => !prev)}
                                    className="flex items-center gap-1 text-xs"
                                >
                                    <Search className="h-3 w-3" />
                                    {isAddPanelOpen ? "Close Finder" : "Add Existing"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsBulkModalOpen(true)}
                                    className="flex items-center gap-1 text-xs"
                                >
                                    <Upload className="h-3 w-3" />
                                    Bulk Upload
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex items-center gap-1 text-xs"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Create Question
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 flex-1">
                            {/* Existing questions selection drawer */}
                            {isAddPanelOpen && (
                                <div className="border bg-muted/30 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
                                    <div className="flex items-center justify-between gap-4">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                            <Sparkles className="h-3 w-3 text-amber-500" />
                                            Add Questions from Database
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <Input
                                            placeholder="Search questions..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-8 flex-1 text-xs min-w-40"
                                        />
                                        {topics.length > 0 && (
                                            <select
                                                value={topicFilter}
                                                onChange={(e) => setTopicFilter(e.target.value)}
                                                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                            >
                                                <option value="">All Topics</option>
                                                {topics.map((t) => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        {searchableQuestions.length > 0 && (
                                            <div className="flex gap-1 shrink-0">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const toAdd = searchableQuestions.map((q) => q.id);
                                                        setLinkedQuestionIds((prev) => {
                                                            const union = new Set([...prev, ...toAdd]);
                                                            return [...union];
                                                        });
                                                        toast.success("Added all filtered questions.");
                                                    }}
                                                    className="h-8 px-2.5 text-xs font-medium"
                                                >
                                                    Select all
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const toRemove = searchableQuestions.map((q) => q.id);
                                                        setLinkedQuestionIds((prev) =>
                                                            prev.filter((id) => !toRemove.includes(id))
                                                        );
                                                        toast.success("Removed all filtered questions.");
                                                    }}
                                                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {searchableQuestions.length === 0 ? (
                                        <p className="text-muted-foreground text-center text-xs py-4 border border-dashed rounded-lg">
                                            No questions found.
                                        </p>
                                    ) : (
                                        <div className="max-h-52 overflow-y-auto border rounded-lg bg-card divide-y">
                                            {searchableQuestions.map((q) => {
                                                const isChecked = linkedQuestionIds.includes(q.id);
                                                const plain = sanitizeHtml(q.question, { allowedTags: [] });
                                                return (
                                                    <label
                                                        key={q.id}
                                                        htmlFor={`add-q-${q.id}`}
                                                        className={`flex cursor-pointer items-center justify-between p-2.5 gap-4 hover:bg-muted/30 transition-colors ${
                                                            isChecked ? "bg-primary/5" : ""
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <input
                                                                id={`add-q-${q.id}`}
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleQuestion(q.id)}
                                                                className="h-4 w-4 shrink-0 accent-primary"
                                                            />
                                                            <span className="text-xs truncate min-w-0 flex-1 flex items-center gap-2">
                                                                {plain || `Question #${q.id}`}
                                                                {q.topic && (
                                                                    <span
                                                                        className="inline-block text-[9px] px-1.5 py-0.5 rounded font-semibold text-white shrink-0"
                                                                        style={{ backgroundColor: q.topic.color }}
                                                                    >
                                                                        {q.topic.name}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Badge variant="outline" className="text-[10px] py-0">{q.marks} marks</Badge>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Linked list rendering */}
                            {linkedQuestions.length === 0 ? (
                                <div className="border border-dashed rounded-xl p-12 text-center">
                                    <p className="text-muted-foreground text-sm">
                                        No questions linked to this series yet.
                                    </p>
                                    <p className="text-muted-foreground/60 text-xs mt-1">
                                        Use "Add Existing" or "Create Question" above.
                                    </p>
                                </div>
                            ) : (
                                <div className="border rounded-xl divide-y overflow-hidden bg-card">
                                    {linkedQuestions.map((q, idx) => {
                                        const plain = sanitizeHtml(q.question, { allowedTags: [] });
                                        return (
                                            <div key={q.id} className="flex items-center justify-between px-4 py-3 gap-4 hover:bg-muted/10 transition-colors">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <span className="text-muted-foreground text-xs font-semibold font-mono">
                                                        {String(idx + 1).padStart(2, "0")}
                                                    </span>
                                                    <span className="text-xs truncate font-medium flex items-center gap-2">
                                                        {plain || `Question #${q.id}`}
                                                        {q.topic && (
                                                            <span
                                                                className="inline-block text-[9px] px-1.5 py-0.5 rounded font-semibold text-white shrink-0"
                                                                style={{ backgroundColor: q.topic.color }}
                                                            >
                                                                {q.topic.name}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge variant="outline" className="text-[10px] py-0">{q.marks} marks</Badge>
                                                    <div className="flex border rounded-md">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled={idx === 0}
                                                            onClick={() => moveUp(idx)}
                                                            className="h-7 w-7 rounded-none border-r last:border-r-0"
                                                            aria-label="Move question up"
                                                        >
                                                            <ArrowUp className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled={idx === linkedQuestions.length - 1}
                                                            onClick={() => moveDown(idx)}
                                                            className="h-7 w-7 rounded-none border-r last:border-r-0"
                                                            aria-label="Move question down"
                                                        >
                                                            <ArrowDown className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeQuestion(q.id)}
                                                            className="h-7 w-7 rounded-none text-destructive hover:bg-destructive/5"
                                                            aria-label="Remove question from series"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Create Question Modal */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
                    onClick={() => setIsCreateModalOpen(false)}
                >
                    <div
                        className="relative bg-background border rounded-xl shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
                            <div>
                                <h3 className="text-lg font-semibold leading-none tracking-tight">Create & Link Question</h3>
                                <p className="text-sm text-muted-foreground mt-1.5">
                                    The newly created question will automatically be added to this series.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full shrink-0"
                                onClick={() => setIsCreateModalOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreateQuestion} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-5 flex-1">
                                {/* Question Text */}
                                <div>
                                    <Label className="mb-2 block font-medium">Question Description</Label>
                                    <div className="overflow-hidden rounded-lg bg-white border text-black">
                                        <ReactQuill
                                            theme="snow"
                                            value={newQText}
                                            onChange={setNewQText}
                                            placeholder="Write your question text here..."
                                            modules={QUILL_MODULES}
                                            formats={QUILL_FORMATS}
                                        />
                                    </div>
                                </div>

                                {/* Marks & Topic */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="q-marks">Marks</Label>
                                        <Input
                                            id="q-marks"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            required
                                            value={newQMarks}
                                            onChange={(e) => setNewQMarks(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="q-topic">Topic</Label>
                                        <select
                                            id="q-topic"
                                            className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            value={newQTopicId}
                                            onChange={(e) => setNewQTopicId(e.target.value)}
                                        >
                                            <option value="">No topic</option>
                                            {topics.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Answers options */}
                                <fieldset className="space-y-3 border-t pt-4">
                                    <legend className="mb-2 text-sm font-semibold">Answer options</legend>
                                    <RadioGroup
                                        value={String(newQOptions.findIndex((o) => o.is_correct))}
                                        onValueChange={(val) =>
                                            setNewQOptions((curr) =>
                                                curr.map((opt, idx) => ({
                                                    ...opt,
                                                    is_correct: idx === Number(val),
                                                }))
                                            )
                                        }
                                        className="space-y-3"
                                    >
                                        {newQOptions.map((opt, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <RadioGroupItem value={String(index)} aria-label={`Option ${index + 1} is correct`} />
                                                <Input
                                                    value={opt.ans}
                                                    onChange={(e) =>
                                                        setNewQOptions((curr) =>
                                                            curr.map((item, idx) =>
                                                                idx === index ? { ...item, ans: e.target.value } : item
                                                            )
                                                        )
                                                    }
                                                    placeholder={`Option ${index + 1}`}
                                                    className="flex-1"
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </fieldset>
                            </div>

                            <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={createBusy}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createBusy}>
                                    {createBusy ? "Creating question..." : "Create Question"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Upload Questions Modal */}
            {isBulkModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
                    onClick={() => setIsBulkModalOpen(false)}
                >
                    <div
                        className="relative bg-background border rounded-xl shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
                            <div>
                                <h3 className="text-lg font-semibold leading-none tracking-tight">Bulk Upload Questions</h3>
                                <p className="text-sm text-muted-foreground mt-1.5">
                                    Upload a JSON file or paste a JSON array of questions to bulk-create and link them.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full shrink-0"
                                onClick={() => setIsBulkModalOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleBulkUploadSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-5 flex-1">
                                {/* JSON file upload */}
                                <div className="space-y-2">
                                    <Label className="font-medium">Upload JSON File</Label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            accept=".json"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={bulkFileLoading}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 text-xs"
                                        >
                                            <Upload className="h-4 w-4" />
                                            {bulkFileLoading ? "Reading file..." : "Choose JSON File"}
                                        </Button>
                                        <span className="text-muted-foreground text-xs">
                                            Or paste your JSON array directly into the editor.
                                        </span>
                                    </div>
                                </div>

                                {/* Text area JSON input */}
                                <div className="space-y-2 flex-1 flex flex-col min-h-64">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="bulk-json" className="font-medium">Question Array JSON</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={copyAiPrompt}
                                                className="h-7 text-[11px] font-semibold text-primary hover:text-primary hover:bg-primary/5"
                                            >
                                                Copy AI Prompt
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => {
                                                    setBulkJsonText(BULK_TEMPLATE_EXAMPLE);
                                                    toast.success("Template pasted into editor!");
                                                }}
                                                className="h-7 text-[11px] font-semibold text-primary hover:text-primary hover:bg-primary/5"
                                            >
                                                Paste Template Example
                                            </Button>
                                        </div>
                                    </div>
                                    <textarea
                                        id="bulk-json"
                                        value={bulkJsonText}
                                        onChange={(e) => setBulkJsonText(e.target.value)}
                                        placeholder={`[\n  {\n    "question": "<p>Example Question</p>",\n    "marks": 2,\n    "options": [\n      { "ans": "Ans A", "is_correct": true },\n      ...\n    ]\n  }\n]`}
                                        className="w-full flex-1 min-h-48 font-mono text-xs p-3 rounded-lg border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-ring resize-none overflow-y-auto"
                                        required
                                    />
                                </div>

                                {/* Display live parsing errors */}
                                {jsonError && (
                                    <div className="rounded-lg border border-destructive bg-destructive/5 p-3 text-xs text-destructive font-medium">
                                        Error: {jsonError}
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsBulkModalOpen(false)}
                                    disabled={bulkBusy}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={bulkBusy}>
                                    {bulkBusy ? "Uploading questions..." : "Upload questions"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
