"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ─── types ────────────────────────────────────────────────────────────────────

type AttemptOption = { id: number; ans: string };

type AttemptQuestion = {
    id: number;
    original_question_id: number;
    position: number;
    question: string;
    marks: string;
    options: AttemptOption[];
    selected_option_id: number | null;
};

export type Attempt = {
    id: number;
    series_id: number;
    series_name: string;
    started_at: string;
    expires_at: string;
    submitted_at: string | null;
    status: string;
    score: string;
    total_marks: string;
    questions: AttemptQuestion[];
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function safeParseUTC(dateStr: string): number {
    if (!dateStr) return 0;
    const hasTimezone = /Z|[+-]\d{2}:?\d{2}$/.test(dateStr);
    const normalized = hasTimezone ? dateStr : `${dateStr}Z`;
    return new Date(normalized).getTime();
}

// ─── component ────────────────────────────────────────────────────────────────

export default function AttemptRunner({ initialAttempt }: { initialAttempt: Attempt }) {
    const [attempt, setAttempt] = useState<Attempt>(initialAttempt);
    const [now, setNow] = useState(() => Date.now());
    const [savingId, setSavingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    // Track whether the timer was ever > 0 in this session.
    // This prevents auto-submit firing immediately when the attempt
    // is already expired on page load (remaining starts at 0).
    const hadTimeRef = useRef(false);

    // Tick every second
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const expiresAt = safeParseUTC(attempt.expires_at);
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const isActive = attempt.status === "in_progress" && remaining > 0;

    // Record that we've seen remaining > 0 at least once
    if (remaining > 0) hadTimeRef.current = true;

    // Auto-submit ONLY when timer transitions from > 0 → 0, not on initial mount
    useEffect(() => {
        if (attempt.status === "in_progress" && remaining === 0 && hadTimeRef.current) {
            handleSubmit(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remaining]);

    const handleAnswer = useCallback(
        async (attemptQuestionId: number, optionId: number) => {
            // Optimistic UI update
            setAttempt((prev) => ({
                ...prev,
                questions: prev.questions.map((q) =>
                    q.id === attemptQuestionId ? { ...q, selected_option_id: optionId } : q,
                ),
            }));
            setSavingId(attemptQuestionId);
            try {
                const res = await fetch(
                    `/api/backend/student/attempts/${attempt.id}/questions/${attemptQuestionId}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ selected_option_id: optionId }),
                    },
                );
                const data = await res.json().catch(() => null);
                if (!res.ok) throw new Error(typeof data?.detail === "string" ? data.detail : "Unable to save answer.");
                setAttempt(data as Attempt);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Unable to save answer.");
                // Revert optimistic update on failure
                setAttempt(initialAttempt);
            } finally {
                setSavingId(null);
            }
        },
        [attempt.id, initialAttempt],
    );

    async function handleSubmit(auto = false) {
        if (!auto && !confirm("Submit this attempt? Answers cannot be changed afterward.")) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/backend/student/attempts/${attempt.id}/submit`, {
                method: "POST",
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(typeof data?.detail === "string" ? data.detail : "Unable to submit.");
            setAttempt(data as Attempt);
            toast.success("Test submitted!");
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Unable to submit.");
        } finally {
            setSubmitting(false);
        }
    }

    const answeredCount = attempt.questions.filter((q) => q.selected_option_id !== null).length;

    return (
        <div className="mx-auto max-w-3xl space-y-5 pb-24">

            {/* ── Sticky header bar ── */}
            <div className="sticky top-16 z-40 flex items-center justify-between gap-4 rounded-xl border bg-background/95 p-4 shadow-sm backdrop-blur">
                <div className="min-w-0">
                    <h1 className="truncate text-lg font-bold">{attempt.series_name}</h1>
                    <div className="mt-1 flex items-center gap-2">
                        <Badge variant={isActive ? "default" : "secondary"} className="text-xs capitalize">
                            {attempt.status.replace("_", " ")}
                        </Badge>
                        {attempt.status !== "in_progress" && (
                            <span className="text-sm font-medium">
                                Score: {attempt.score} / {attempt.total_marks}
                            </span>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    {isActive ? (
                        <>
                            <p
                                className={`font-mono text-2xl font-bold tabular-nums ${remaining < 60 ? "text-destructive animate-pulse" : ""}`}
                            >
                                {formatTime(remaining)}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {answeredCount}/{attempt.questions.length} answered
                            </p>
                        </>
                    ) : (
                        <p className="font-mono text-2xl font-bold tabular-nums">
                            {formatTime(0)}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Questions ── */}
            {attempt.questions.map((q) => {
                const isSaving = savingId === q.id;
                return (
                    <Card key={q.id} className={isSaving ? "opacity-70 transition-opacity" : "transition-opacity"}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium leading-relaxed">
                                <span className="mr-2 font-bold">{q.position}.</span>
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeHtml(q.question, {
                                            allowedTags: [...sanitizeHtml.defaults.allowedTags, "sub", "sup"],
                                        }),
                                    }}
                                />
                                <span className="text-muted-foreground ml-2 text-sm font-normal">
                                    ({q.marks} mark{q.marks !== "1.00" ? "s" : ""})
                                </span>
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-2" role="radiogroup" aria-label={`Options for question ${q.position}`}>
                                {q.options.map((opt) => {
                                    const isSelected = q.selected_option_id === opt.id;
                                    const isDisabled = !isActive || isSaving;

                                    return (
                                        <label
                                            key={opt.id}
                                            htmlFor={`opt-${q.id}-${opt.id}`}
                                            className={[
                                                "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
                                                isDisabled ? "cursor-not-allowed opacity-60" : "hover:bg-muted/50",
                                                isSelected
                                                    ? "border-primary bg-primary/5 font-medium"
                                                    : "border-border",
                                            ].join(" ")}
                                        >
                                            <input
                                                id={`opt-${q.id}-${opt.id}`}
                                                type="radio"
                                                name={`question-${q.id}`}
                                                value={String(opt.id)}
                                                checked={isSelected}
                                                disabled={isDisabled}
                                                onChange={() => {
                                                    if (!isDisabled) handleAnswer(q.id, opt.id);
                                                }}
                                                className="h-4 w-4 shrink-0 accent-primary"
                                            />
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: sanitizeHtml(opt.ans, {
                                                        allowedTags: [...sanitizeHtml.defaults.allowedTags, "sub", "sup"],
                                                    }),
                                                }}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            {/* ── Submit button ── */}
            {isActive && (
                <div className="fixed bottom-6 left-0 right-0 flex justify-center px-6">
                    <Button
                        onClick={() => handleSubmit(false)}
                        disabled={submitting}
                        size="lg"
                        className="w-full max-w-3xl shadow-lg"
                    >
                        {submitting ? "Submitting…" : `Submit test (${answeredCount}/${attempt.questions.length} answered)`}
                    </Button>
                </div>
            )}

            {/* ── Result after submission / expiry ── */}
            {(attempt.status === "submitted" || attempt.status === "expired") && (
                <Card
                    className={`text-center ${
                        attempt.status === "submitted"
                            ? "border-primary/30 bg-primary/5"
                            : "border-destructive/30 bg-destructive/5"
                    }`}
                >
                    <CardContent className="py-8">
                        {attempt.status === "submitted" ? (
                            <>
                                <p className="text-muted-foreground text-sm">Final score</p>
                                <p className="mt-1 text-4xl font-bold">
                                    {attempt.score}{" "}
                                    <span className="text-muted-foreground text-2xl">/ {attempt.total_marks}</span>
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-destructive font-semibold text-lg">Time expired</p>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Your time ran out before you could submit.
                                </p>
                                <p className="mt-3 text-2xl font-bold">
                                    {attempt.score}{" "}
                                    <span className="text-muted-foreground text-xl">/ {attempt.total_marks}</span>
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
