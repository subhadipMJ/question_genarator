"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { sanitizeHtmlContent } from "@/lib/sanitize";
import { toast } from "sonner";
import { AlertTriangle, Check, LayoutGrid, List, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── types ────────────────────────────────────────────────────────────────────

type AttemptOption = { id: number; ans: string; diagram_path?: string | null };

type AttemptQuestion = {
    id: number;
    original_question_id: number;
    position: number;
    question: string;
    marks: string;
    options: AttemptOption[];
    selected_option_id: number | null;
    correct_option_id?: number | null;
    diagram_path?: string | null;
    diagrams?: { id: number; path: string }[];
};

export type Attempt = {
    id: number;
    series_id: number;
    series_name: string;
    started_at: string;
    expires_at: string;
    submitted_at: string | null;
    status: number | string;
    score: string;
    total_marks: string;
    questions: AttemptQuestion[];
};

// ─── status helpers (backend returns int: 0=IN_PROGRESS 1=EXPIRED 2=SUBMITTED 3=FORCE_SUBMITTED) ───

function isInProgress(s: number | string | null | undefined): boolean {
    return s === 0 || s === "0" || s === "in_progress";
}

function isExpired(s: number | string | null | undefined): boolean {
    return s === 1 || s === "1" || s === "expired";
}

function isSubmitted(s: number | string | null | undefined): boolean {
    return s === 2 || s === "2" || s === "submitted" || s === 3 || s === "3" || s === "force_submitted";
}

function statusLabel(s: number | string | null | undefined): string {
    if (isInProgress(s)) return "In Progress";
    if (isExpired(s)) return "Expired";
    if (s === 3 || s === "3" || s === "force_submitted") return "Force Submitted";
    if (isSubmitted(s)) return "Submitted";
    return String(s ?? "");
}

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
    skipInstructions = false,
}: {
    initialAttempt: Attempt;
    readOnly?: boolean;
    skipInstructions?: boolean;
}) {
    const [attempt, setAttempt] = useState<Attempt>(initialAttempt);
    const [now, setNow] = useState(() => Date.now());
    const [savingId, setSavingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [instructionsOpen, setInstructionsOpen] = useState(
        !readOnly && !skipInstructions && isInProgress(initialAttempt.status),
    );
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [fullscreenWarningOpen, setFullscreenWarningOpen] = useState(false);
    const [fullscreenCountdown, setFullscreenCountdown] = useState(10);
    const [instructionsAccepted, setInstructionsAccepted] = useState(false);
    const [userViewMode, setUserViewMode] = useState<"single" | "list">("list");
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
    const router = useRouter();
    const tabWasHiddenRef = useRef(false);
    const fullscreenSubmitStartedRef = useRef(false);
    const fullscreenWarningTriggeredRef = useRef(false);
    const fullscreenWarningDeadlineRef = useRef(0);
    const hadTimeRef = useRef(false);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const answeredCount = attempt.questions.filter((q) => q.selected_option_id !== null).length;
    const expiresAt = safeParseUTC(attempt.expires_at);
    const startedAt = safeParseUTC(attempt.started_at);
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const isActive = !readOnly && isInProgress(attempt.status) && remaining > 0;
    const effectiveViewMode = isActive ? "single" : userViewMode;

    useEffect(() => {
        if (readOnly || !isInProgress(attempt.status)) return;

        const checkDevTools = () => {
            const widthDiff = window.outerWidth - window.innerWidth > 160;
            const heightDiff = window.outerHeight - window.innerHeight > 160;

            let isConsoleOpen = false;
            const element = new Image();
            Object.defineProperty(element, "id", {
                get: function () {
                    isConsoleOpen = true;
                },
            });
            console.log("%c", element);

            const isOpen = widthDiff || heightDiff || isConsoleOpen;
            setIsDevToolsOpen(isOpen);

            if (isOpen && isActive && !instructionsOpen && !fullscreenSubmitStartedRef.current) {
                toast.error("Developer tools detected. Your test is being force submitted.");
                void handleSubmit(true, true);
            }
        };

        checkDevTools();
        const interval = setInterval(checkDevTools, 1000);
        window.addEventListener("resize", checkDevTools);

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", checkDevTools);
        };
    }, [isActive, instructionsOpen, readOnly, attempt.status]);

    // Re-apply the chrome-hiding class after entering the test.
    // Navigating from the start page (?started=1) re-renders the server layout,
    // which strips the imperatively-added class from <html> even though the page
    // is still in fullscreen — leaving the sidebar/header visible during the exam.
    useEffect(() => {
        if (readOnly || instructionsOpen || !isInProgress(attempt.status)) return;
        if (typeof document !== "undefined" && document.fullscreenElement) {
            document.documentElement.classList.add("exam-fullscreen");
        }
    }, [instructionsOpen, attempt.status, readOnly]);

    useEffect(() => {
        if (!isActive || instructionsOpen) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden" && !fullscreenSubmitStartedRef.current) {
                setTabSwitchCount((count) => count + 1);
                toast.error("Tab switch detected. Your test is being force submitted.");
                void handleSubmit(true, true);
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !fullscreenSubmitStartedRef.current) {
                document.documentElement.classList.remove("exam-fullscreen");
                toast.error("Fullscreen exited. Your test is being force submitted.");
                void handleSubmit(true, true);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const allowedKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"];
            if (allowedKeys.includes(e.key)) {
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                    e.preventDefault();
                    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                    e.preventDefault();
                    setCurrentQuestionIndex((prev) => Math.min(attempt.questions.length - 1, prev + 1));
                }
                return;
            }

            // Block all other keys (F1-F12, Esc, Tab, letters, numbers, shortcuts) and show warning toast
            e.preventDefault();
            e.stopPropagation();
            toast.warning("Keyboard key disabled. Only Arrow keys and Enter are allowed during the exam.", {
                id: "disabled-key-toast",
            });
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            toast.warning("Right click is disabled during the exam.", {
                id: "disabled-context-menu-toast",
            });
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("contextmenu", handleContextMenu, true);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("contextmenu", handleContextMenu, true);
            document.documentElement.classList.remove("exam-fullscreen");
        };
    }, [instructionsOpen, isActive, attempt.questions.length]);

    useEffect(() => {
        if (!fullscreenWarningOpen) return;

        const updateCountdown = () => {
            const secondsLeft = Math.max(
                0,
                Math.ceil((fullscreenWarningDeadlineRef.current - Date.now()) / 1000),
            );
            setFullscreenCountdown(secondsLeft);

            if (secondsLeft === 0) {
                setFullscreenWarningOpen(false);
                void handleSubmit(true, true);
            }
        };

        updateCountdown();
        const timer = window.setInterval(updateCountdown, 250);
        return () => window.clearInterval(timer);
        // The warning deadline is fixed when fullscreen is exited.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullscreenWarningOpen]);

    // Record that we've seen remaining > 0 at least once
    if (remaining > 0) hadTimeRef.current = true;

    // Auto-submit ONLY when timer transitions from > 0 → 0, not on initial mount
    useEffect(() => {
        if (!readOnly && isInProgress(attempt.status) && remaining === 0 && hadTimeRef.current && !instructionsOpen) {
            handleSubmit(true, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remaining, instructionsOpen]);

    const handleAnswer = useCallback(
        async (attemptQuestionId: number, optionId: number | null) => {
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

    async function handleSubmit(bypassModal = false, isForce = false) {
        if (readOnly) return;
        if (!bypassModal) {
            setSubmitModalOpen(true);
            return;
        }
        if (fullscreenSubmitStartedRef.current) return;
        fullscreenSubmitStartedRef.current = true;
        setFullscreenWarningOpen(false);
        setSubmitModalOpen(false);
        setSubmitting(true);
        try {
            const res = await fetch(`/api/backend/student/attempts/${attempt.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force_submit: isForce ? 1 : 0 }),
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
            fullscreenSubmitStartedRef.current = false;
            toast.error(err instanceof Error ? err.message : "Unable to submit.");
        } finally {
            setSubmitting(false);
        }
    }

    async function reenterFullscreen() {
        try {
            if (!document.fullscreenElement) {
                document.documentElement.classList.add("exam-fullscreen");
                await document.documentElement.requestFullscreen();
            }
            fullscreenWarningDeadlineRef.current = 0;
            fullscreenWarningTriggeredRef.current = false;
            setFullscreenWarningOpen(false);
            toast.success("Fullscreen restored. You may continue the test.");
        } catch {
            document.documentElement.classList.remove("exam-fullscreen");
            toast.error("Unable to enter fullscreen. Please allow fullscreen access.");
        }
    }

    const currentQuestion = attempt.questions[currentQuestionIndex];

    async function enterTest() {
        if (!instructionsAccepted || isDevToolsOpen) return;

        try {
            if (!document.fullscreenElement) {
                document.documentElement.classList.add("exam-fullscreen");
                await document.documentElement.requestFullscreen();
            }
            fullscreenSubmitStartedRef.current = false;
            fullscreenWarningTriggeredRef.current = false;
            setInstructionsOpen(false);
            setNow(Date.now());
        } catch {
            document.documentElement.classList.remove("exam-fullscreen");
            toast.error("Fullscreen permission is required to start the test.");
        }
    }

    function renderQuestionCard(q: AttemptQuestion) {
        const isSaving = savingId === q.id;
        const isSubmittedState = isSubmitted(attempt.status);

        return (
            <Card key={q.id} id={`question-${q.id}`} className={`scroll-mt-24 ${isSaving ? "opacity-70 transition-opacity" : "transition-opacity"}`}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium leading-relaxed flex items-start justify-between gap-3">
                        <div>
                            <span className="mr-2 font-bold">{q.position}.</span>
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: sanitizeHtmlContent(q.question),
                                }}
                            />
                            {q.diagrams && q.diagrams.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-3">
                                    {q.diagrams.map((d) => (
                                        <img
                                            key={d.id}
                                            src={`/api/backend/${d.path}`}
                                            alt="Question Diagram"
                                            className="max-h-80 max-w-full rounded border bg-background p-1.5 object-contain shadow-xs"
                                        />
                                    ))}
                                </div>
                            ) : q.diagram_path ? (
                                <div className="mt-3">
                                    <img
                                        src={`/api/backend/${q.diagram_path}`}
                                        alt="Question Diagram"
                                        className="max-h-80 max-w-full rounded border bg-background p-1.5 object-contain shadow-xs"
                                    />
                                </div>
                            ) : null}
                            <span className="text-muted-foreground ml-2 text-sm font-normal">
                                ({q.marks} mark{q.marks !== "1.00" ? "s" : ""})
                            </span>
                        </div>
                        {isSubmittedState && (
                            <span className="shrink-0">
                                {q.selected_option_id === null ? (
                                    <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        Unanswered
                                    </Badge>
                                ) : q.correct_option_id != null && String(q.selected_option_id) === String(q.correct_option_id) ? (
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
                    <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label={`Options for question ${q.position}`}>
                        {q.options.map((opt) => {
                            const isSelected = q.selected_option_id != null && String(q.selected_option_id) === String(opt.id);
                            const isDisabled = !isActive || isSaving;
                            const isCorrect = q.correct_option_id != null && String(q.correct_option_id) === String(opt.id);

                            let containerClasses = "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors";
                            
                            if (isSubmittedState) {
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
                                    htmlFor={isSubmittedState ? undefined : `opt-${q.id}-${opt.id}`}
                                    className={containerClasses}
                                    onClick={(e) => {
                                        if (isSubmittedState || isDisabled) return;
                                        if (isSelected) {
                                            e.preventDefault();
                                            handleAnswer(q.id, null);
                                        }
                                    }}
                                >
                                    {isSubmittedState ? (
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
                                    <div className="flex-1 space-y-1.5">
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: sanitizeHtmlContent(opt.ans),
                                            }}
                                        />
                                        {opt.diagram_path && (
                                            <div>
                                                <img
                                                    src={`/api/backend/${opt.diagram_path}`}
                                                    alt="Option Diagram"
                                                    className="max-h-40 max-w-full rounded border bg-background p-1 object-contain shadow-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {isSubmittedState && isCorrect && (
                                        <Badge variant="outline" className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                            {isSelected ? "Correct (Selected)" : "Correct Option"}
                                        </Badge>
                                    )}
                                    {isSubmittedState && !isCorrect && isSelected && (
                                        <Badge variant="outline" className="ml-auto border-destructive/30 bg-destructive/10 text-destructive">
                                            Incorrect Selection
                                        </Badge>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                    {q.selected_option_id !== null && isActive && !readOnly && (
                        <div className="mt-4 flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs border-dashed text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                                onClick={() => handleAnswer(q.id, null)}
                                disabled={isSaving}
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Clear selection
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {instructionsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-3xl border-primary/20 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-2xl">Resume this test</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border bg-muted/40 p-3 text-center">
                                    <p className="text-xl font-bold">{attempt.questions.length}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Question{attempt.questions.length === 1 ? "" : "s"}
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-muted/40 p-3 text-center">
                                    <p className="font-mono text-xl font-bold">
                                        {formatTime(Math.max(0, Math.floor((expiresAt - startedAt) / 1000)))}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Test duration</p>
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3 text-sm">
                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <p className="font-semibold">Fullscreen mode required</p>
                                    <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                                        You must remain in fullscreen mode. If you exit fullscreen at any point, your test will be <strong>force submitted</strong> immediately.
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <p className="font-semibold">Do not switch tabs or windows</p>
                                    <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                                        Switching tabs or leaving this test window will trigger an immediate <strong>force submission</strong>.
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <p className="font-semibold">Keyboard restrictions</p>
                                    <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                                        Only <strong>Arrow keys</strong> (to navigate questions) and <strong>Enter key</strong> are allowed. All other keyboard keys are disabled.
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-foreground/80">
                                You are resuming an active test. Enter fullscreen to continue.
                            </p>
                            <label
                                htmlFor="accept-test-instructions"
                                className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm"
                            >
                                <input
                                    id="accept-test-instructions"
                                    type="checkbox"
                                    checked={instructionsAccepted}
                                    onChange={(event) => setInstructionsAccepted(event.target.checked)}
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                                />
                                <span>
                                    I have read and understood the instructions and agree to follow the test rules.
                                </span>
                            </label>
                            {isDevToolsOpen && (
                                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs font-semibold text-destructive flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>Developer Tools / Inspect Element detected. Please close Developer Tools to continue.</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 cursor-pointer"
                                    size="lg"
                                    onClick={() => router.push("/student/tests")}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 cursor-pointer"
                                    size="lg"
                                    onClick={enterTest}
                                    disabled={!instructionsAccepted || isDevToolsOpen}
                                >
                                    Resume test in fullscreen
                                </Button>
                            </div>
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
                                <Button className="flex-1" onClick={() => handleSubmit(true, false)} disabled={submitting}>
                                    {submitting ? "Submitting…" : "Submit test"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {fullscreenWarningOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <Card
                        className="w-full max-w-md border-destructive/40 shadow-2xl"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="fullscreen-warning-title"
                    >
                        <CardHeader className="items-center text-center">
                            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                                <AlertTriangle className="h-7 w-7 text-destructive" />
                            </div>
                            <CardTitle id="fullscreen-warning-title" className="text-destructive">
                                Fullscreen exited
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 text-center">
                            <p className="text-sm text-muted-foreground">
                                Leaving fullscreen is not allowed during the test. Your attempt will be submitted automatically.
                            </p>
                            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Submitting in
                                </p>
                                <p className="mt-1 font-mono text-5xl font-bold tabular-nums text-destructive">
                                    {fullscreenCountdown}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    second{fullscreenCountdown === 1 ? "" : "s"}
                                </p>
                            </div>
                            <p className="text-xs font-medium text-destructive">
                                Return to fullscreen before the countdown ends to continue.
                            </p>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={reenterFullscreen}
                                disabled={submitting}
                            >
                                Enter fullscreen
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="mx-auto max-w-6xl space-y-5 pb-24">

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
            <div data-exam-header className="sticky top-16 z-40 flex items-center justify-between gap-4 rounded-xl border bg-background p-4 shadow-sm backdrop-blur">
                <div className="min-w-0">
                    <h1 className="truncate text-lg font-bold">{attempt.series_name}</h1>
                    <div className="mt-1 flex items-center gap-2">
                        <Badge variant={isActive ? "default" : "secondary"} className="text-xs capitalize">
                            {statusLabel(attempt.status)}
                        </Badge>
                        {!isInProgress(attempt.status) && (
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

            {/* ── Test workspace ── */}
            <div className={effectiveViewMode === "list" ? "space-y-5 w-full" : "grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"}>
            <div className="space-y-5">
            {/* ── View Mode Toggle & Questions Header ── */}
            <div className="flex items-center justify-between gap-3 pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {effectiveViewMode === "list"
                        ? `All Questions (${attempt.questions.length})`
                        : `Question ${currentQuestionIndex + 1} of ${attempt.questions.length}`}
                </span>
                {!isActive && (
                    <div className="flex items-center rounded-lg border bg-muted/40 p-1">
                        <Button
                            type="button"
                            variant={effectiveViewMode === "single" ? "default" : "ghost"}
                            size="sm"
                            className="h-7 px-2.5 text-xs cursor-pointer"
                            onClick={() => setUserViewMode("single")}
                        >
                            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
                            Single Question
                        </Button>
                        <Button
                            type="button"
                            variant={effectiveViewMode === "list" ? "default" : "ghost"}
                            size="sm"
                            className="h-7 px-2.5 text-xs cursor-pointer"
                            onClick={() => setUserViewMode("list")}
                        >
                            <List className="mr-1.5 h-3.5 w-3.5" />
                            List View (All)
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Questions List or Single View ── */}
            {effectiveViewMode === "list" ? (
                <div className="space-y-5">
                    {attempt.questions.map((q) => renderQuestionCard(q))}
                </div>
            ) : (
                <>
                    {currentQuestion && renderQuestionCard(currentQuestion)}

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
                </>
            )}

            {/* ── Result after submission / expiry ── */}
            {(isSubmitted(attempt.status) || isExpired(attempt.status)) && (
                <Card
                    className={`text-center ${
                        isSubmitted(attempt.status)
                            ? "border-primary/30 bg-primary/5"
                            : "border-destructive/30 bg-destructive/5"
                    }`}
                >
                    <CardContent className="py-8">
                        {isSubmitted(attempt.status) ? (
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
            {/* ── end left column ── */}

            {/* ── Question palette / navigator (Only in single view) ── */}
            {effectiveViewMode === "single" && (
                <aside data-exam-sidebar className="lg:sticky lg:top-32">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Questions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-6"
                                role="navigation"
                                aria-label="Question navigator"
                            >
                                {attempt.questions.map((q, index) => {
                                    const answered = q.selected_option_id !== null;
                                    const isCurrent = index === currentQuestionIndex;
                                    let bubbleClasses =
                                        "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors ";
                                    if (answered) {
                                        bubbleClasses += "border-emerald-500 bg-emerald-500 text-white ";
                                    } else {
                                        bubbleClasses += "border-border bg-muted text-muted-foreground hover:bg-muted/70 ";
                                    }
                                    if (isCurrent) {
                                        bubbleClasses += "ring-2 ring-primary ring-offset-2 ring-offset-background ";
                                    }
                                    return (
                                        <button
                                            key={q.id}
                                            type="button"
                                            onClick={() => setCurrentQuestionIndex(index)}
                                            className={bubbleClasses}
                                            aria-label={`Question ${q.position}, ${answered ? "answered" : "not answered"}`}
                                            aria-current={isCurrent ? "true" : undefined}
                                        >
                                            {q.position}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-2 border-t pt-4 text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="h-4 w-4 shrink-0 rounded-full border border-border bg-muted" />
                                    <span className="text-muted-foreground">Not answered</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="h-4 w-4 shrink-0 rounded-full border border-emerald-500 bg-emerald-500" />
                                    <span className="text-muted-foreground">Answered</span>
                                </div>
                            </div>

                            {isActive && (
                                <div className="space-y-2 border-t pt-4">
                                    <p className="text-center text-sm text-muted-foreground">
                                        {answeredCount}/{attempt.questions.length} answered
                                    </p>
                                    <Button
                                        onClick={() => handleSubmit(false)}
                                        disabled={submitting}
                                        size="lg"
                                        className="w-full shadow-md"
                                    >
                                        {submitting ? "Submitting…" : "Submit test"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </aside>
            )}
            </div>
            {/* ── end two-panel grid ── */}
            </div>
        </>
    );
}
