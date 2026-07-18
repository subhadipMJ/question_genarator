"use client";

import { FormEvent, useState, useMemo } from "react";
import { toast } from "sonner";
import sanitizeHtml from "sanitize-html";
import Link from "next/link";
import type { TestSeries } from "../services/test-series";
import type { Question } from "../services/questions";
import type { Topic } from "../services/topics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getApiError(data: unknown, status: number): string {
    if (data && typeof data === "object") {
        const v = data as { detail?: unknown; message?: unknown };
        if (typeof v.detail === "string") return v.detail;
        if (Array.isArray(v.detail)) {
            const msgs = v.detail.flatMap((i) =>
                i && typeof i === "object" && "msg" in i ? [String(i.msg)] : [],
            );
            if (msgs.length) return msgs.join(" ");
        }
        if (typeof v.message === "string") return v.message;
    }
    return `Request failed (${status}).`;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

function formatExpiry(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const expired = d < now;
    const dateStr = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    const timeStr = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return `${expired ? "Expired" : "Expires"} ${dateStr} at ${timeStr}`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col items-center rounded-xl border bg-muted/40 px-4 py-3 text-center">
            <span className="text-2xl font-bold tabular-nums">{value}</span>
            <span className="text-muted-foreground mt-0.5 text-xs font-medium uppercase tracking-widest">{label}</span>
        </div>
    );
}

function SeriesCard({
    s,
    origin,
    canEdit,
    onEdit,
}: {
    s: TestSeries;
    origin: string;
    canEdit: boolean;
    onEdit: () => void;
}) {
    const expired = new Date(s.valid_until) < new Date();
    return (
        <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            {/* accent stripe */}
            <div className={`absolute inset-y-0 left-0 w-1 rounded-l-xl ${expired ? "bg-muted-foreground/30" : "bg-primary"}`} />

            <CardContent className="pl-5 pr-4 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate text-base leading-tight mb-1">{s.name}</p>
                    <p className="text-muted-foreground text-xs">
                        {s.question_ids.length} question{s.question_ids.length !== 1 ? "s" : ""} ·{" "}
                        {formatDuration(s.duration_seconds)} · {formatExpiry(s.valid_until)}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                        {s.invite_token && (
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${origin}/student/join#token=${s.invite_token}`);
                                    toast.success("Invite link copied!");
                                }}
                                className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                            >
                                Copy invite link
                            </button>
                        )}
                        {s.invite_token && canEdit && <span className="text-muted-foreground text-xs">·</span>}
                        {canEdit && (
                            <button
                                type="button"
                                onClick={onEdit}
                                className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge
                        variant={s.access_type === "public" ? "default" : "secondary"}
                        className="text-[11px]"
                    >
                        {s.access_type === "public" ? "Public" : "Invite only"}
                    </Badge>
                    {expired && (
                        <Badge variant="outline" className="text-[11px] text-muted-foreground">
                            Expired
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

function formatDateTimeLocal(isoString?: string): string {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    // Offset to local time
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function TestSeriesManager({
    initialSeries,
    questions,
    topics = [],
    userId,
    userRole,
    userOrgId,
}: {
    initialSeries: TestSeries[];
    questions: Question[];
    topics?: Topic[];
    userId: number;
    userRole?: string;
    userOrgId?: number;
}) {
    const [series, setSeries] = useState(initialSeries);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [search, setSearch] = useState("");
    const [topicFilter, setTopicFilter] = useState("");
    const [busy, setBusy] = useState(false);
    const [newInviteToken, setNewInviteToken] = useState<string | null>(null);
    const [origin, setOrigin] = useState("");
    const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null);

    function handleEdit(s: TestSeries) {
        setEditingSeries(s);
        setSelected(new Set(s.question_ids));
        setNewInviteToken(null);
    }

    function cancelEdit() {
        setEditingSeries(null);
        setSelected(new Set());
    }

    // get origin only on client
    useMemo(() => {
        if (typeof window !== "undefined") setOrigin(window.location.origin);
    }, []);

    const filtered = useMemo(() => {
        let result = questions;

        if (topicFilter) {
            result = result.filter((question) => question.topic_id === Number(topicFilter));
        }

        const q = search.toLowerCase();
        if (!q) return result;
        return result.filter((question) => {
            const plain = sanitizeHtml(question.question, { allowedTags: [] }).toLowerCase();
            return plain.includes(q) || String(question.id).includes(q);
        });
    }, [questions, search, topicFilter]);

    function toggleQuestion(id: number) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function selectAll() {
        setSelected(new Set(filtered.map((q) => q.id)));
    }
    function clearAll() {
        setSelected(new Set());
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (selected.size === 0) {
            toast.error("Select at least one question.");
            return;
        }

        const f = new FormData(e.currentTarget);
        const validUntil = new Date(String(f.get("valid_until")));
        if (Number.isNaN(validUntil.getTime()) || validUntil.getTime() <= Date.now()) {
            toast.error("Valid until must be a future date and time.");
            return;
        }
        const durationMinutes = Number(f.get("duration_minutes"));
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
            toast.error("Duration must be greater than zero.");
            return;
        }

        setBusy(true);
        try {
            const url = editingSeries
                ? `/api/backend/test-series/${editingSeries.id}`
                : "/api/backend/test-series/";
            const method = editingSeries ? "PATCH" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: String(f.get("name") ?? "").trim(),
                    access_type: f.get("access_type"),
                    valid_until: validUntil.toISOString(),
                    duration_seconds: Math.round(durationMinutes * 60),
                    question_ids: [...selected],
                    is_active: true,
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(getApiError(data, res.status));

            if (editingSeries) {
                setSeries((prev) => prev.map((s) => (s.id === editingSeries.id ? (data as TestSeries) : s)));
                setNewInviteToken((data as TestSeries).invite_token ?? null);
                setEditingSeries(null);
                toast.success("Test series updated!");
            } else {
                setSeries((prev) => [data as TestSeries, ...prev]);
                setNewInviteToken((data as TestSeries).invite_token ?? null);
                toast.success("Test series created!");
            }
            setSelected(new Set());
            (e.target as HTMLFormElement).reset();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : `Unable to ${editingSeries ? "update" : "create"} test series.`);
        } finally {
            setBusy(false);
        }
    }

    const totalMarks = [...selected].reduce((sum, id) => {
        const q = questions.find((q) => q.id === id);
        return sum + (q ? parseFloat(q.marks) : 0);
    }, 0);

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            {/* ── Page Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Test Series</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Create timed assessments and share them with students.
                    </p>
                </div>
                <div className="flex gap-3">
                    <StatPill label="Total Series" value={series.length} />
                    <StatPill label="Active" value={series.filter((s) => new Date(s.valid_until) >= new Date()).length} />
                </div>
            </div>

            {/* ── Create Form ── */}
            <Card>
                <CardHeader>
                    <CardTitle>{editingSeries ? "Edit test series" : "Create a new test series"}</CardTitle>
                    <CardDescription>
                        {editingSeries
                            ? `Modify the details and questions for "${editingSeries.name}"`
                            : "Configure the details, then pick questions from the list below."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        key={editingSeries ? `edit-${editingSeries.id}` : "create"}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        {/* Row 1: name + access type */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="ts-name">Series name</Label>
                                <Input
                                    id="ts-name"
                                    name="name"
                                    placeholder="e.g. Physics Mock Test 1"
                                    required
                                    autoComplete="off"
                                    defaultValue={editingSeries?.name ?? ""}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ts-access">Access type</Label>
                                <select
                                    id="ts-access"
                                    name="access_type"
                                    className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    defaultValue={editingSeries?.access_type ?? "invite_only"}
                                >
                                    <option value="public">Public — anyone can start</option>
                                    <option value="invite_only">Invite only — share a link</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: valid until + duration */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="ts-valid-until">Valid until</Label>
                                <Input
                                    id="ts-valid-until"
                                    name="valid_until"
                                    type="datetime-local"
                                    required
                                    defaultValue={formatDateTimeLocal(editingSeries?.valid_until)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ts-duration">Duration (minutes)</Label>
                                <Input
                                    id="ts-duration"
                                    name="duration_minutes"
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 60"
                                    required
                                    defaultValue={
                                        editingSeries
                                            ? Math.round(editingSeries.duration_seconds / 60)
                                            : ""
                                    }
                                />
                            </div>
                        </div>

                        {/* Question picker */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <Label className="text-base font-semibold">
                                    Questions{" "}
                                    {selected.size > 0 && (
                                        <span className="text-muted-foreground ml-1 text-sm font-normal">
                                            ({selected.size} selected · {totalMarks.toFixed(2)} total marks)
                                        </span>
                                    )}
                                </Label>
                                <div className="flex items-center gap-2">
                                    {topics.length > 0 && (
                                        <select
                                            id="ts-topic-filter"
                                            value={topicFilter}
                                            onChange={(e) => setTopicFilter(e.target.value)}
                                            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                        >
                                            <option value="">All topics</option>
                                            {topics.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <Input
                                        id="ts-search"
                                        placeholder="Search questions…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-8 w-40 text-sm"
                                    />
                                    {filtered.length > 0 && (
                                        <>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                onClick={selectAll}
                                            >
                                                Select all
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="h-8 text-xs"
                                                onClick={clearAll}
                                            >
                                                Clear
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {questions.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-8 text-center">
                                    <p className="text-muted-foreground text-sm">
                                        No questions are available. Create questions first before making a test series.
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="mt-4"
                                        nativeButton={false}
                                        render={<Link href="/questions/create" />}
                                    >
                                        Create a question
                                    </Button>
                                </div>
                            ) : filtered.length === 0 ? (
                                <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                                    No questions match &ldquo;{search}&rdquo;.
                                </p>
                            ) : (
                                <div className="max-h-72 overflow-y-auto rounded-lg border">
                                    {filtered.map((q) => {
                                        const isChecked = selected.has(q.id);
                                        const plain = sanitizeHtml(q.question, { allowedTags: [] });
                                        return (
                                            <label
                                                key={q.id}
                                                htmlFor={`q-${q.id}`}
                                                className={`flex cursor-pointer items-center gap-3 border-b px-4 py-3 last:border-b-0 transition-colors ${
                                                    isChecked
                                                        ? "bg-primary/5"
                                                        : "hover:bg-muted/50"
                                                }`}
                                            >
                                                <input
                                                    id={`q-${q.id}`}
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleQuestion(q.id)}
                                                    className="h-4 w-4 shrink-0 accent-primary"
                                                />
                                                <span className="min-w-0 flex-1 truncate text-sm flex items-center gap-2">
                                                    {plain || `Question #${q.id}`}
                                                    {q.topic && (
                                                        <span
                                                            className="inline-block text-[10px] px-1.5 py-0.5 rounded font-semibold text-white shrink-0"
                                                            style={{ backgroundColor: q.topic.color }}
                                                        >
                                                            {q.topic.name}
                                                        </span>
                                                    )}
                                                </span>
                                                <Badge variant="outline" className="shrink-0 text-[11px]">
                                                    {q.marks} marks
                                                </Badge>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                type="submit"
                                disabled={busy || questions.length === 0}
                                className="w-full sm:w-auto"
                            >
                                {busy
                                    ? editingSeries
                                        ? "Saving…"
                                        : "Creating…"
                                    : editingSeries
                                    ? "Save changes"
                                    : "Create test series"}
                            </Button>
                            {editingSeries && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={cancelEdit}
                                    className="w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>

                    {/* Invite link banner */}
                    {newInviteToken && (
                        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-4">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold">Invite link (copy it now — won&apos;t be shown again)</p>
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
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setNewInviteToken(null)}
                            >
                                Dismiss
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Series List ── */}
            <section aria-label="Existing test series">
                <h2 className="mb-4 text-lg font-semibold">All test series</h2>
                {series.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-10 text-center">
                        <p className="text-muted-foreground text-sm">No test series yet. Create one above.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {series.map((s) => {
                            const canEdit =
                                (userRole === "0" && s.org_id === 0) ||
                                (userRole === "1" && s.org_id === userOrgId) ||
                                s.created_by === userId;
                            return (
                                <SeriesCard
                                    key={s.id}
                                    s={s}
                                    origin={origin}
                                    canEdit={canEdit}
                                    onEdit={() => handleEdit(s)}
                                />
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
