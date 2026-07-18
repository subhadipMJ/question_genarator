"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { AvailableTest, AttemptSummary } from "./page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.ceil((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

export default function StudentTests({
    tests,
    history,
    organizations = {},
}: {
    tests: AvailableTest[];
    history: AttemptSummary[];
    organizations?: Record<number, string>;
}) {
    const [busy, setBusy] = useState<number | null>(null);
    const [pendingTestId, setPendingTestId] = useState<number | null>(null);
    const router = useRouter();

    // Build a map: series_id → most recent attempt
    const attemptBySeriesId = new Map<number, AttemptSummary>();
    for (const a of history) {
        const existing = attemptBySeriesId.get(a.series_id);
        // Keep the most recent (highest id)
        if (!existing || a.id > existing.id) {
            attemptBySeriesId.set(a.series_id, a);
        }
    }

    const availableTests = tests.filter((t) => {
        const existingAttempt = attemptBySeriesId.get(t.id);
        return !existingAttempt || existingAttempt.status === "in_progress";
    });

    async function start(seriesId: number) {
        // Check if there's already an in-progress attempt — just redirect
        const existing = attemptBySeriesId.get(seriesId);
        if (existing && existing.status === "in_progress") {
            router.push(`/student/attempts/${existing.id}`);
            return;
        }

        setPendingTestId(null);
        setBusy(seriesId);
        try {
            const res = await fetch("/api/backend/student/test-series/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ series_id: seriesId }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                const msg = typeof data?.detail === "string" ? data.detail : "Unable to start test.";

                // Backend says already attempted — redirect to existing attempt
                if (
                    msg.toLowerCase().includes("already") ||
                    msg.toLowerCase().includes("finished") ||
                    msg.toLowerCase().includes("attempted")
                ) {
                    if (existing) {
                        toast.info("Redirecting to your existing attempt.");
                        router.push(`/student/attempts/${existing.id}`);
                        return;
                    }
                }
                throw new Error(msg);
            }

            router.push(`/student/attempts/${(data as { id: number }).id}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Unable to start test.");
        } finally {
            setBusy(null);
        }
    }

    if (availableTests.length === 0) {
        return (
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-6 text-3xl font-bold tracking-tight">Available tests</h1>
                <p className="text-muted-foreground">No public tests are currently available.</p>
            </div>
        );
    }

    return (
        <>
        {pendingTestId !== null && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader>
                        <CardTitle>Start this test now?</CardTitle>
                        <CardDescription>
                            The timer begins immediately after you start the test.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setPendingTestId(null)}
                        >
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={() => start(pendingTestId)}>
                            Start test
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )}

        <div className="mx-auto max-w-7xl space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Available tests</h1>

            <div className="grid gap-4 sm:grid-cols-3">
                {availableTests.map((t) => {
                    const existingAttempt = attemptBySeriesId.get(t.id);
                    const isInProgress = existingAttempt?.status === "in_progress";
                    const isSubmitted = existingAttempt?.status === "submitted";
                    const isExpired = new Date(t.valid_until) < new Date();
                    const orgName = t.org_id === 0 ? "QMaster" : organizations[t.org_id] ?? `Organization #${t.org_id}`;

                    return (
                        <Card key={t.id} className="relative overflow-hidden">
                            {/* Accent stripe */}
                            <div
                                className={`absolute inset-y-0 left-0 w-1 rounded-l-xl ${
                                    isExpired
                                        ? "bg-muted"
                                        : isSubmitted
                                        ? "bg-green-500"
                                        : isInProgress
                                        ? "bg-amber-500"
                                        : "bg-primary"
                                }`}
                            />

                            <CardHeader className="pl-5">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-lg leading-snug">{t.name}</CardTitle>
                                    {isInProgress && (
                                        <Badge variant="secondary" className="shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                            In progress
                                        </Badge>
                                    )}
                                    {isSubmitted && (
                                        <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Completed
                                        </Badge>
                                    )}
                                    {isExpired && !existingAttempt && (
                                        <Badge variant="outline" className="shrink-0 text-muted-foreground">
                                            Expired
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription>
                                    {t.question_count} question{t.question_count !== 1 ? "s" : ""} ·{" "}
                                    {formatDuration(t.duration_seconds)} ·{" "}
                                    <span className="font-semibold text-primary">{orgName}</span>
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pl-5 space-y-3">
                                <p className="text-muted-foreground text-xs">
                                    Available until {new Date(t.valid_until).toLocaleString()}
                                </p>

                                {/* Score display for submitted attempts */}
                                {isSubmitted && existingAttempt && (
                                    <p className="text-sm font-medium">
                                        Score:{" "}
                                        <span className="text-primary">
                                            {existingAttempt.score} / {existingAttempt.total_marks}
                                        </span>
                                    </p>
                                )}

                                {/* Action button */}
                                {isInProgress ? (
                                    <Button
                                        className="w-full"
                                        onClick={() => router.push(`/student/attempts/${existingAttempt!.id}`)}
                                    >
                                        Resume test →
                                    </Button>
                                ) : isSubmitted ? (
                                    <Button variant="outline" className="w-full" nativeButton={false} render={<Link href={`/student/attempts/${existingAttempt!.id}`} />}>
                                        View results
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        disabled={busy === t.id || isExpired}
                                        onClick={() => setPendingTestId(t.id)}
                                    >
                                        {busy === t.id ? "Starting…" : isExpired ? "Expired" : "Start test"}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
        </>
    );
}
