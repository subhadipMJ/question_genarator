"use client";

import Link from "next/link";
import {
    GraduationCap,
    CheckCircle2,
    Clock,
    Award,
    ArrowRight,
    FileText,
    AlertTriangle,
    History as HistoryIcon,
    Sparkles,
    KeyRound,
    Bookmark,
    TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AvailableTest, AttemptHistory } from "../services/student";

interface StudentDashboardProps {
    userName: string;
    availableTests: AvailableTest[];
    totalAvailableTests: number;
    history: AttemptHistory[];
}

function formatDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return "60 mins";
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} hr${h > 1 ? "s" : ""}`;
    return `${m} mins`;
}

export function StudentDashboard({
    userName,
    availableTests,
    totalAvailableTests,
    history,
}: StudentDashboardProps) {
    const totalAttempts = history.length;

    // Completed attempts (submitted or force_submitted)
    const completedAttempts = history.filter(
        (a) => a.status === "submitted" || a.status === 2 || a.status === "force_submitted" || a.status === 3
    );

    // Active in-progress attempt (if any)
    const inProgressAttempt = history.find(
        (a) => a.status === "in_progress" || a.status === 0
    );

    // Calculate average score percentage
    const scoredAttempts = completedAttempts.filter(
        (a) => a.is_score_show !== false && Number(a.total_marks) > 0 && !isNaN(Number(a.score))
    );

    const avgScorePct =
        scoredAttempts.length > 0
            ? Math.round(
                  scoredAttempts.reduce(
                      (sum, a) => sum + (Number(a.score) / Number(a.total_marks)) * 100,
                      0
                  ) / scoredAttempts.length
              )
            : null;

    // Recent attempts (up to 4)
    const recentAttempts = history.slice(0, 4);

    // Available tests slice (up to 4)
    const recentAvailableTests = availableTests.slice(0, 4);

    return (
        <div className="space-y-6">
            {/* ── 1. Welcome Card Banner ── */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-xs">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs font-semibold gap-1">
                                <Sparkles className="h-3 w-3" />
                                Student Portal
                            </Badge>
                        </div>
                        <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Welcome back, {userName}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Here is a snapshot of your assessments, performance, and recent activity.
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                        <Button variant="default" size="sm" className="gap-2 shadow-xs cursor-pointer font-medium" nativeButton={false} render={<Link href="/student/tests" />}>
                            <GraduationCap className="h-4 w-4" />
                            Browse Tests
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 cursor-pointer font-medium" nativeButton={false} render={<Link href="/student/history" />}>
                            <HistoryIcon className="h-4 w-4" />
                            View History
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* ── Active Attempt Alert (If any) ── */}
            {inProgressAttempt && (
                <Card className="border-amber-500/40 bg-amber-500/10 shadow-xs">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                    Active Assessment in Progress
                                </p>
                                <p className="text-sm font-bold text-foreground">
                                    {inProgressAttempt.series_name}
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 font-medium"
                            nativeButton={false}
                            render={<Link href={`/student/attempts/${inProgressAttempt.id}?started=1`} />}
                        >
                            Resume Test
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ── 2. Minimal KPI Metrics ── */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {/* Available Tests */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Available Tests
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <GraduationCap className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAvailableTests}</div>
                        <p className="text-xs text-muted-foreground mt-1">Ready for you to take</p>
                    </CardContent>
                </Card>

                {/* Total Completed */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Completed Tests
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedAttempts.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalAttempts} total attempt{totalAttempts === 1 ? "" : "s"}
                        </p>
                    </CardContent>
                </Card>

                {/* Active in progress */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            In Progress
                        </CardTitle>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${inProgressAttempt ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inProgressAttempt ? 1 : 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {inProgressAttempt ? "Active test running" : "No ongoing test"}
                        </p>
                    </CardContent>
                </Card>

                {/* Average Score */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Average Score
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Award className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {avgScorePct !== null ? `${avgScorePct}%` : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {scoredAttempts.length > 0
                                ? `Based on ${scoredAttempts.length} announced result${scoredAttempts.length === 1 ? "" : "s"}`
                                : "Results pending announcement"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ── 3. Two-Column Activity & Tests Overview ── */}
            <div className="grid gap-6 md:grid-cols-2 items-start">
                {/* ── Left Column: Available Tests ── */}
                <Card className="h-full flex flex-col shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">Available Tests</CardTitle>
                            <CardDescription className="text-xs">
                                Tests you are eligible to take
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1 h-8 px-2" nativeButton={false} render={<Link href="/student/tests" />}>
                            View all
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-3">
                        {recentAvailableTests.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center bg-muted/20">
                                <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                                <p className="text-xs text-muted-foreground">
                                    No new tests are currently available for your batch.
                                </p>
                            </div>
                        ) : (
                            recentAvailableTests.map((test) => (
                                <div
                                    key={test.id}
                                    className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card/60 hover:bg-muted/40 transition-colors"
                                >
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                            {test.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                            <span className="flex items-center gap-1 font-mono">
                                                <FileText className="h-3 w-3" />
                                                {test.question_count} Qs
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 font-mono">
                                                <Clock className="h-3 w-3" />
                                                {formatDuration(test.duration_seconds)}
                                            </span>
                                            {test.topics && test.topics.length > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[120px] text-primary/80">
                                                        {test.topics[0]}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs shrink-0 font-medium cursor-pointer"
                                        nativeButton={false}
                                        render={<Link href="/student/tests" />}
                                    >
                                        Start
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* ── Right Column: Recent Attempts ── */}
                <Card className="h-full flex flex-col shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">Recent Attempts</CardTitle>
                            <CardDescription className="text-xs">
                                Your recent exam submissions and scores
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1 h-8 px-2" nativeButton={false} render={<Link href="/student/history" />}>
                            View all
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-3">
                        {recentAttempts.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center bg-muted/20">
                                <HistoryIcon className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                                <p className="text-xs text-muted-foreground">
                                    You have not attempted any tests yet.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 text-xs"
                                    nativeButton={false}
                                    render={<Link href="/student/tests" />}
                                >
                                    Start your first test
                                </Button>
                            </div>
                        ) : (
                            recentAttempts.map((attempt) => {
                                const isSubmitted = attempt.status === "submitted" || attempt.status === 2;
                                const isForceSubmitted = attempt.status === "force_submitted" || attempt.status === 3;
                                const isInProgress = attempt.status === "in_progress" || attempt.status === 0;
                                const canViewResult = attempt.is_result_show !== false;
                                const canViewScore = attempt.is_score_show !== false;

                                return (
                                    <Link
                                        key={attempt.id}
                                        href={canViewResult ? `/student/attempts/${attempt.id}` : "/student/history"}
                                        className="block p-3 rounded-lg border bg-card/60 hover:bg-muted/40 transition-colors group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                    {attempt.series_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(attempt.submitted_at || attempt.started_at).toLocaleDateString(
                                                        "en-US",
                                                        { month: "short", day: "numeric", year: "numeric" }
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {canViewScore && isSubmitted && (
                                                    <span className="text-xs font-bold font-mono text-foreground">
                                                        {attempt.score} / {attempt.total_marks}
                                                    </span>
                                                )}

                                                <div className="flex items-center gap-1">
                                                    {isInProgress ? (
                                                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                            In progress
                                                        </Badge>
                                                    ) : isForceSubmitted ? (
                                                        <Badge variant="outline" className="text-[10px] border-destructive/40 bg-destructive/10 text-destructive">
                                                            Force Submitted
                                                        </Badge>
                                                    ) : isSubmitted ? (
                                                        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                                            Completed
                                                        </Badge>
                                                    ) : null}

                                                    {!isInProgress && (
                                                        canViewResult ? (
                                                            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-medium">
                                                                Result Out
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 font-medium">
                                                                Pending
                                                            </Badge>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── 4. Study & Performance Tools ── */}
            <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card hover:border-primary/40 transition-all shadow-2xs">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Performance & Progress</p>
                                <p className="text-xs text-muted-foreground">Deep dive into test scores, progression, and trends.</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0 gap-1 text-xs cursor-pointer font-medium" nativeButton={false} render={<Link href="/student/analysis" />}>
                            Analyze
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 via-card to-card hover:border-red-500/40 transition-all shadow-2xs">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                                <Bookmark className="h-5 w-5 fill-current" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Mistake Notebook</p>
                                <p className="text-xs text-muted-foreground">Revisit incorrect questions & doubts across tests.</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0 gap-1 text-xs cursor-pointer font-medium" nativeButton={false} render={<Link href="/student/revision" />}>
                            Revise
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* ── Quick Join Assessment Card ── */}
            <Card className="border-dashed bg-muted/20 shadow-2xs">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Have an invite code or private assessment token?</p>
                            <p className="text-xs text-muted-foreground">Enter an assessment code from your teacher to unlock private tests.</p>
                        </div>
                    </div>
                    <Button variant="default" size="sm" className="shrink-0 gap-1.5 font-medium cursor-pointer" nativeButton={false} render={<Link href="/student/join" />}>
                        Join Test with Code
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
