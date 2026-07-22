"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    correct_option_id?: number | null;
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

export default function AttemptRunner({
    initialAttempt,
    readOnly = false,
}: {
    initialAttempt: Attempt;
    readOnly?: boolean;
}) {
    const [attempt, setAttempt] = useState<Attempt>(initialAttempt);
    const [now, setNow] = useState(() => Date.now());
    const [savingId, setSavingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [instructionsOpen, setInstructionsOpen] = useState(!readOnly && initialAttempt.status === "in_progress");
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const router = useRouter();
    const tabWasHiddenRef = useRef(false);
    const fullscreenSubmitStartedRef = useRef(false);

    // Track whether the timer was ever > 0 in this session.
    // This prevents auto-submit firing immediately when the attempt
    // is already expired on page load (remaining starts at 0).
    const hadTimeRef = useRef(false);

    // Tick every second only when instructions are closed
    useEffect(() => {
        if (instructionsOpen) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [instructionsOpen]);

    const answeredCount = attempt.questions.filter((q) => q.selected_option_id !== null).length;
    const expiresAt = safeParseUTC(attempt.expires_at);
    const startedAt = safeParseUTC(attempt.started_at);
    // While instructions are open on initial start, display full duration without ticking down
    const remaining = (instructionsOpen && answeredCount === 0)
        ? Math.max(0, Math.floor((expiresAt - startedAt) / 1000))
        : Math.max(0, Math.floor((expiresAt - now) / 1000));
    const isActive = !readOnly && attempt.status === "in_progress" && remaining > 0;

    useEffect(() => {
        if (!isActive || instructionsOpen) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                tabWasHiddenRef.current = true;
                return;
            }

            if (tabWasHiddenRef.current) {
                tabWasHiddenRef.current = false;
                setTabSwitchCount((count) => count + 1);
                toast.warning("Tab switching is not allowed during the test.");
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !fullscreenSubmitStartedRef.current) {
                document.documentElement.classList.remove("exam-fullscreen");
                fullscreenSubmitStartedRef.current = true;
                toast.error("Fullscreen exited. Your test is being submitted automatically.");
                void handleSubmit(true);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.documentElement.classList.remove("exam-fullscreen");
        };
        // handleSubmit intentionally uses the latest attempt state from this render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instructionsOpen, isActive]);

    // Record that we've seen remaining > 0 at least once
    if (remaining > 0) hadTimeRef.current = true;

    // Auto-submit ONLY when timer transitions from > 0 → 0, not on initial mount
    useEffect(() => {
        if (!readOnly && attempt.status === "in_progress" && remaining === 0 && hadTimeRef.current && !instructionsOpen) {
            handleSubmit(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remaining, instructionsOpen]);

    const handleAnswer = useCallback(
        async (attemptQuestionId: number, optionId: number) => {
            if (readOnly) return;
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
        [attempt.id, initialAttempt, readOnly],
    );

    async function handleSubmit(auto = false) {
        if (readOnly) return;
        if (!auto) {
            setSubmitModalOpen(true);
            return;
        }
        setSubmitModalOpen(false);
        setSubmitting(true);
        try {
            const res = await fetch(`/api/backend/student/attempts/${attempt.id}/submit`, {
                method: "POST",
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(typeof data?.detail === "string" ? data.detail : "Unable to submit.");
            setAttempt(data as Attempt);
            fullscreenSubmitStartedRef.current = true;
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(() => undefined);
            }
            document.documentElement.classList.remove("exam-fullscreen");
            toast.success("Test submitted!");
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Unable to submit.");
        } finally {
            setSubmitting(false);
        }
    }

    const currentQuestion = attempt.questions[currentQuestionIndex];

    async function enterTest() {
        try {
            if (!document.fullscreenElement) {
                document.documentElement.classList.add("exam-fullscreen");
                await document.documentElement.requestFullscreen();
            }
            fullscreenSubmitStartedRef.current = false;
            setInstructionsOpen(false);

            // Call backend endpoint to start the timer officially at this exact moment
            const res = await fetch(`/api/backend/student/attempts/${attempt.id}/start-timer`, {
                method: "POST",
            });
            if (res.ok) {
                const data = await res.json().catch(() => null);
                if (data) {
                    setAttempt(data as Attempt);
                    setNow(Date.now());
                }
            }
        } catch {
            document.documentElement.classList.remove("exam-fullscreen");
            toast.error("Fullscreen permission is required to start the test.");
        }
    }

    return (
        <>
            {instructionsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-lg border-primary/20 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-2xl">Before you begin</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3 text-sm">
                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <p className="font-semibold">You will enter fullscreen mode</p>
                                    <p className="mt-1 text-muted-foreground">Remain in fullscreen until you submit the test.</p>
                                </div>
                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <p className="font-semibold">Do not switch tabs or windows</p>
                                    <p className="mt-1 text-muted-foreground">Leaving this test screen will be detected and recorded.</p>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-foreground/80">
                                Your test timer will officially start when you click the button below.
                            </p>
                            <Button className="w-full cursor-pointer" size="lg" onClick={enterTest}>
                                Start in fullscreen
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {submitModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md shadow-2xl">
                        <CardHeader>
                            <CardTitle>Submit this test?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <p className="text-sm text-muted-foreground">
                                You answered {answeredCount} of {attempt.questions.length} questions. Answers cannot be changed after submission.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setSubmitModalOpen(false)}
                                    disabled={submitting}
                                >
                                    Continue test
                                </Button>
                                <Button className="flex-1" onClick={() => handleSubmit(true)} disabled={submitting}>
                                    {submitting ? "Submitting…" : "Submit test"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="mx-auto max-w-3xl space-y-5 pb-24">

            {readOnly && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                    Read-only staff view. Answers and submission cannot be changed.
                </div>
            )}

            {tabSwitchCount > 0 && isActive && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    Warning: tab or window switching detected {tabSwitchCount} time{tabSwitchCount === 1 ? "" : "s"}.
                </div>
            )}

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
            {currentQuestion && (() => {
                const q = currentQuestion;
                const isSaving = savingId === q.id;
                const isSubmitted = readOnly || attempt.status === "submitted" || attempt.status === "expired";
                return (
                    <Card key={q.id} className={isSaving ? "opacity-70 transition-opacity" : "transition-opacity"}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium leading-relaxed flex items-start justify-between gap-3">
                                <div>
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
                                </div>
                                {isSubmitted && (
                                    <span className="shrink-0">
                                        {q.selected_option_id === null ? (
                                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                Unanswered
                                            </Badge>
                                        ) : q.correct_option_id && q.selected_option_id === q.correct_option_id ? (
                                            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                Correct
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
                                                Incorrect
                                            </Badge>
                                        )}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-2" role="radiogroup" aria-label={`Options for question ${q.position}`}>
                                {q.options.map((opt) => {
                                    const isSelected = q.selected_option_id === opt.id;
                                    const isDisabled = !isActive || isSaving;
                                    const isCorrect = q.correct_option_id === opt.id;

                                    let containerClasses = "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors";
                                    
                                    if (isSubmitted) {
                                        containerClasses += " cursor-default";
                                        if (isCorrect) {
                                            containerClasses += " border-emerald-500 bg-emerald-500/5 font-medium dark:bg-emerald-950/20";
                                        } else if (isSelected) {
                                            containerClasses += " border-destructive bg-destructive/5 dark:bg-destructive/10";
                                        } else {
                                            containerClasses += " border-border opacity-60";
                                        }
                                    } else {
                                        containerClasses += isDisabled ? " cursor-not-allowed opacity-60" : " cursor-pointer hover:bg-muted/50";
                                        containerClasses += isSelected ? " border-primary bg-primary/5 font-medium" : " border-border";
                                    }

                                    return (
                                        <label
                                            key={opt.id}
                                            htmlFor={isSubmitted ? undefined : `opt-${q.id}-${opt.id}`}
                                            className={containerClasses}
                                        >
                                            {isSubmitted ? (
                                                isCorrect ? (
                                                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 font-bold" />
                                                ) : isSelected ? (
                                                    <X className="h-4 w-4 text-destructive shrink-0 font-bold" />
                                                ) : (
                                                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                                                )
                                            ) : (
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
                                            )}
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: sanitizeHtml(opt.ans, {
                                                        allowedTags: [...sanitizeHtml.defaults.allowedTags, "sub", "sup"],
                                                    }),
                                                }}
                                            />
                                            {isSubmitted && isCorrect && (
                                                <Badge variant="outline" className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                                    {isSelected ? "Correct (Selected)" : "Correct Option"}
                                                </Badge>
                                            )}
                                            {isSubmitted && !isCorrect && isSelected && (
                                                <Badge variant="outline" className="ml-auto border-destructive/30 bg-destructive/10 text-destructive">
                                                    Incorrect Selection
                                                </Badge>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );
            })()}

            {attempt.questions.length > 1 && (
                <div className="flex items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                        disabled={currentQuestionIndex === 0}
                    >
                        Previous
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {attempt.questions.length}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex((index) => Math.min(attempt.questions.length - 1, index + 1))}
                        disabled={currentQuestionIndex === attempt.questions.length - 1}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* ── Submit button ── */}
            {isActive && (
                <div className="pt-4 flex justify-center">
                    <Button
                        onClick={() => handleSubmit(false)}
                        disabled={submitting}
                        size="lg"
                        className="w-full shadow-md"
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
        </>
    );
}
