"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Topic } from "../../services/topics";

// ─── Types ─────────────────────────────────────────────────────────────────

type OptionDraft = { ans: string; is_correct: boolean };

type QuestionDraft = {
    id: string; // local key only
    question: string;
    marks: string;
    is_active: boolean;
    topic_id?: string;
    options: OptionDraft[];
};

type ValidationError = { index: number; message: string };

// ─── Constants ─────────────────────────────────────────────────────────────

const EXAMPLE_JSON = JSON.stringify(
    [
        {
            question: "<p>What is the capital of France?</p>",
            marks: 1,
            is_active: true,
            topic_id: 1,
            options: [
                { ans: "Paris", is_correct: true },
                { ans: "Berlin", is_correct: false },
                { ans: "Rome", is_correct: false },
                { ans: "Madrid", is_correct: false },
            ],
        },
        {
            question: "<p>Which planet is closest to the Sun?</p>",
            marks: 2,
            is_active: true,
            topic_id: 2,
            options: [
                { ans: "Venus", is_correct: false },
                { ans: "Mercury", is_correct: true },
                { ans: "Earth", is_correct: false },
                { ans: "Mars", is_correct: false },
            ],
        },
    ],
    null,
    2,
);

function makeBlankQuestion(): QuestionDraft {
    return {
        id: crypto.randomUUID(),
        question: "",
        marks: "1",
        is_active: true,
        topic_id: "",
        options: [
            { ans: "", is_correct: true },
            { ans: "", is_correct: false },
            { ans: "", is_correct: false },
            { ans: "", is_correct: false },
        ],
    };
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateDrafts(drafts: QuestionDraft[]): ValidationError[] {
    const errors: ValidationError[] = [];
    drafts.forEach((q, i) => {
        const plainText = q.question.replace(/<[^>]*>/g, "").trim();
        if (!plainText) errors.push({ index: i, message: "Question text is required." });
        const marks = parseFloat(q.marks);
        if (!Number.isFinite(marks) || marks <= 0) errors.push({ index: i, message: "Marks must be > 0." });
        if (q.options.length < 2) errors.push({ index: i, message: "At least 2 options required." });
        if (q.options.some((o) => !o.ans.trim())) errors.push({ index: i, message: "All option texts must be filled." });
        const correctCount = q.options.filter((o) => o.is_correct).length;
        if (correctCount !== 1) errors.push({ index: i, message: "Exactly one option must be marked correct." });
    });
    return errors;
}

// ─── Helper to parse raw JSON into QuestionDraft[] ──────────────────────────

function parseJsonToDrafts(raw: string): QuestionDraft[] {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error("JSON must be an array of questions.");
    return (parsed as Record<string, unknown>[]).map((item, i) => {
        if (typeof item !== "object" || item === null) throw new Error(`Item ${i + 1} is not an object.`);
        const opts = item.options;
        if (!Array.isArray(opts) || opts.length < 2) throw new Error(`Item ${i + 1}: "options" must be an array with at least 2 items.`);
        return {
            id: crypto.randomUUID(),
            question: String(item.question ?? ""),
            marks: String(item.marks ?? "1"),
            is_active: item.is_active !== false,
            topic_id: item.topic_id ? String(item.topic_id) : "",
            options: (opts as Record<string, unknown>[]).map((o, oi) => ({
                ans: String(o.ans ?? ""),
                is_correct: o.is_correct === true,
            })),
        };
    });
}

// ─── Question Card (builder mode) ───────────────────────────────────────────

function QuestionCard({
    q,
    index,
    error,
    onChange,
    onRemove,
    canRemove,
    topics,
}: {
    q: QuestionDraft;
    index: number;
    error?: string;
    onChange: (updated: QuestionDraft) => void;
    onRemove: () => void;
    canRemove: boolean;
    topics: Topic[];
}) {
    function setField<K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) {
        onChange({ ...q, [key]: value });
    }

    function setOptionAns(oi: number, ans: string) {
        const opts = q.options.map((o, idx) => (idx === oi ? { ...o, ans } : o));
        setField("options", opts);
    }

    function setCorrect(oi: number) {
        const opts = q.options.map((o, idx) => ({ ...o, is_correct: idx === oi }));
        setField("options", opts);
    }

    function addOption() {
        setField("options", [...q.options, { ans: "", is_correct: false }]);
    }

    function removeOption(oi: number) {
        if (q.options.length <= 2) return;
        const remaining = q.options.filter((_, idx) => idx !== oi);
        if (!remaining.some((o) => o.is_correct)) remaining[0].is_correct = true;
        setField("options", remaining);
    }

    return (
        <Card className={`relative overflow-hidden ${error ? "border-destructive" : ""}`}>
            {/* numbered stripe */}
            <div className="absolute inset-y-0 left-0 flex w-10 items-center justify-center rounded-l-xl bg-muted/60 text-sm font-bold text-muted-foreground">
                {index + 1}
            </div>

            <div className="ml-10">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Question {index + 1}
                        </CardTitle>
                        {canRemove && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive h-7 text-xs"
                                onClick={onRemove}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                    {error && <p className="text-destructive text-xs">{error}</p>}
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Question text */}
                    <div className="space-y-1.5">
                        <Label htmlFor={`q-${q.id}-text`}>Question text (HTML supported)</Label>
                        <textarea
                            id={`q-${q.id}-text`}
                            rows={3}
                            value={q.question}
                            onChange={(e) => setField("question", e.target.value)}
                            placeholder="<p>Enter your question here…</p>"
                            className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                        />
                    </div>

                    {/* Marks + Topic + Active */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor={`q-${q.id}-marks`}>Marks</Label>
                            <Input
                                id={`q-${q.id}-marks`}
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={q.marks}
                                onChange={(e) => setField("marks", e.target.value)}
                                className="w-24"
                            />
                        </div>

                        <div className="space-y-1.5 w-48">
                            <Label htmlFor={`q-${q.id}-topic`}>Topic (Optional)</Label>
                            <select
                                id={`q-${q.id}-topic`}
                                value={q.topic_id ?? ""}
                                onChange={(e) => setField("topic_id", e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Default (Inherit global or none)</option>
                                {topics.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 text-sm mt-5">
                            <input
                                type="checkbox"
                                checked={q.is_active}
                                onChange={(e) => setField("is_active", e.target.checked)}
                                className="h-4 w-4 accent-primary"
                            />
                            Active
                        </label>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            Options{" "}
                            <span className="text-muted-foreground text-xs font-normal">
                                (● = correct answer)
                            </span>
                        </p>
                        {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name={`correct-${q.id}`}
                                    checked={opt.is_correct}
                                    onChange={() => setCorrect(oi)}
                                    aria-label={`Mark option ${oi + 1} as correct`}
                                    className="h-4 w-4 shrink-0 accent-primary"
                                />
                                <Input
                                    value={opt.ans}
                                    onChange={(e) => setOptionAns(oi, e.target.value)}
                                    placeholder={`Option ${oi + 1}`}
                                    className={`flex-1 ${opt.is_correct ? "border-primary bg-primary/5" : ""}`}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive h-8 text-xs shrink-0"
                                    disabled={q.options.length <= 2}
                                    onClick={() => removeOption(oi)}
                                >
                                    ✕
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-1 h-8 text-xs"
                            onClick={addOption}
                        >
                            + Add option
                        </Button>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

type Mode = "builder" | "json";

export default function BulkUploader({ topics = [] }: { topics?: Topic[] }) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [mode, setMode] = useState<Mode>("builder");
    const [drafts, setDrafts] = useState<QuestionDraft[]>([makeBlankQuestion()]);
    const [globalTopicId, setGlobalTopicId] = useState<string>("");
    const [jsonText, setJsonText] = useState("");
    const [jsonError, setJsonError] = useState("");
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ created: number; ids: number[] } | null>(null);

    // ── JSON mode helpers ──────────────────────────────────────────────────

    function loadFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => setJsonText(String(e.target?.result ?? ""));
        reader.readAsText(file);
    }

    function parseJson() {
        setJsonError("");
        try {
            const parsed = parseJsonToDrafts(jsonText);
            setDrafts(parsed);
            setMode("builder");
            toast.success(`Loaded ${parsed.length} question${parsed.length !== 1 ? "s" : ""} — review and submit.`);
        } catch (err) {
            setJsonError(err instanceof Error ? err.message : "Invalid JSON.");
        }
    }

    // ── Builder helpers ────────────────────────────────────────────────────

    function updateDraft(index: number, updated: QuestionDraft) {
        setDrafts((prev) => prev.map((q, i) => (i === index ? updated : q)));
    }

    function removeDraft(index: number) {
        setDrafts((prev) => prev.filter((_, i) => i !== index));
    }

    // ── Submit ─────────────────────────────────────────────────────────────

    async function handleSubmit() {
        const errors = validateDrafts(drafts);
        setValidationErrors(errors);
        if (errors.length > 0) {
            toast.error(`Fix ${errors.length} error${errors.length > 1 ? "s" : ""} before submitting.`);
            return;
        }

        setBusy(true);
        try {
            const payload = drafts.map(({ question, marks, is_active, topic_id, options }) => {
                const finalTopicId = topic_id || globalTopicId;
                return {
                    question,
                    marks: parseFloat(marks),
                    is_active,
                    topic_id: finalTopicId ? Number(finalTopicId) : null,
                    options: options.map(({ ans, is_correct }) => ({ ans: ans.trim(), is_correct })),
                };
            });

            const res = await fetch("/api/backend/questions/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                const msg =
                    typeof data?.detail === "string"
                        ? data.detail
                        : Array.isArray(data?.detail)
                        ? data.detail.map((d: { msg: string }) => d.msg).join(" ")
                        : "Bulk upload failed.";
                throw new Error(msg);
            }

            const ids = (data as { id: number }[]).map((q) => q.id);
            setResult({ created: ids.length, ids });
            setDrafts([makeBlankQuestion()]);
            setValidationErrors([]);
            toast.success(`${ids.length} question${ids.length !== 1 ? "s" : ""} created!`);
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Bulk upload failed.");
        } finally {
            setBusy(false);
        }
    }

    const errorMap = new Map(validationErrors.map((e) => [e.index, e.message]));

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bulk upload questions</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Build questions interactively or paste / upload a JSON file.
                </p>
            </div>

            {/* ── Success Banner ── */}
            {result && (
                <Alert className="border-green-500/40 bg-green-50 dark:bg-green-950/20">
                    <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                        <span>
                            ✅ <strong>{result.created}</strong> question{result.created !== 1 ? "s" : ""} created
                            successfully (IDs: {result.ids.join(", ")}).
                        </span>
                        <Button size="sm" variant="outline" onClick={() => router.push("/questions")}>
                            View all questions
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* ── Mode tabs ── */}
            <div className="flex gap-2">
                <Button
                    id="tab-builder"
                    variant={mode === "builder" ? "default" : "outline"}
                    onClick={() => setMode("builder")}
                >
                    Interactive builder
                </Button>
                <Button
                    id="tab-json"
                    variant={mode === "json" ? "default" : "outline"}
                    onClick={() => setMode("json")}
                >
                    JSON upload
                </Button>
            </div>

            {/* ── JSON mode ── */}
            {mode === "json" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Paste or upload JSON</CardTitle>
                        <CardDescription>
                            JSON must be an array. Each item needs{" "}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">question</code>,{" "}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">marks</code>, and{" "}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">options</code> (min 2, exactly one{" "}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">is_correct: true</code>). You can also
                            optionally supply{" "}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">topic_id</code>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* File picker */}
                        <div className="flex items-center gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,application/json"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) loadFile(file);
                                }}
                            />
                            <Button
                                id="btn-choose-file"
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Choose JSON file
                            </Button>
                            <span className="text-muted-foreground text-sm">or paste below</span>
                        </div>

                        <textarea
                            id="json-input"
                            rows={14}
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            placeholder={EXAMPLE_JSON}
                            spellCheck={false}
                            className="border-input bg-background w-full rounded-lg border px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        />

                        {jsonError && (
                            <Alert variant="destructive">
                                <AlertDescription>{jsonError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-2">
                            <Button id="btn-load-json" onClick={parseJson} disabled={!jsonText.trim()}>
                                Load & preview
                            </Button>
                            <Button
                                id="btn-load-example"
                                variant="ghost"
                                onClick={() => setJsonText(EXAMPLE_JSON)}
                            >
                                Load example
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Builder mode ── */}
            {mode === "builder" && (
                <div className="space-y-4">
                    {/* Stats bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="secondary" className="text-sm">
                                {drafts.length} question{drafts.length !== 1 ? "s" : ""}
                            </Badge>
                            {validationErrors.length > 0 && (
                                <Badge variant="destructive" className="text-sm">
                                    {validationErrors.length} error{validationErrors.length !== 1 ? "s" : ""}
                                </Badge>
                            )}

                            {/* Global Topic Select */}
                            {topics.length > 0 && (
                                <div className="flex items-center gap-2 sm:ml-4">
                                    <Label htmlFor="global-topic" className="text-xs shrink-0 text-muted-foreground">Apply Topic to All:</Label>
                                    <select
                                        id="global-topic"
                                        value={globalTopicId}
                                        onChange={(e) => setGlobalTopicId(e.target.value)}
                                        className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="">No Global Topic</option>
                                        {topics.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                id="btn-add-question"
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDrafts((prev) => [...prev, makeBlankQuestion()])}
                            >
                                + Add question
                            </Button>
                            <Button
                                id="btn-submit-bulk"
                                size="sm"
                                disabled={busy || drafts.length === 0}
                                onClick={handleSubmit}
                            >
                                {busy
                                    ? "Uploading…"
                                    : `Upload ${drafts.length} question${drafts.length !== 1 ? "s" : ""}`}
                            </Button>
                        </div>
                    </div>

                    {/* Question cards */}
                    <div className="space-y-4">
                        {drafts.map((q, i) => (
                            <QuestionCard
                                key={q.id}
                                q={q}
                                index={i}
                                error={errorMap.get(i)}
                                onChange={(updated) => updateDraft(i, updated)}
                                onRemove={() => removeDraft(i)}
                                canRemove={drafts.length > 1}
                                topics={topics}
                            />
                        ))}
                    </div>

                    {/* Bottom submit */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDrafts((prev) => [...prev, makeBlankQuestion()])}
                        >
                            + Add question
                        </Button>
                        <Button
                            id="btn-submit-bulk-bottom"
                            disabled={busy || drafts.length === 0}
                            onClick={handleSubmit}
                        >
                            {busy
                                ? "Uploading…"
                                : `Upload ${drafts.length} question${drafts.length !== 1 ? "s" : ""}`}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
