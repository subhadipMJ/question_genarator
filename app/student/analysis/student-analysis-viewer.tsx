"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Search,
    CheckCircle2,
    Clock,
    Trophy,
    ExternalLink,
    X,
    Filter,
    Activity,
    TrendingUp,
    Award,
    RotateCcw,
    Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { StudentHistoryResponse } from "@/app/services/users";

function formatDateTime(value: string | null) {
    if (!value) return "Not submitted";
    try {
        const date = new Date(value);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "—";
    }
}

export default function StudentAnalysisViewer({
    initialData,
}: {
    initialData: StudentHistoryResponse;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "force_submitted" | "incomplete">("all");
    const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "score_desc" | "score_asc">("date_desc");

    // Filter and sort results
    const filteredHistory = useMemo(() => {
        const list = initialData.history.filter((item) => {
            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                if (!item.series_name.toLowerCase().includes(q)) return false;
            }

            // Status filter
            if (statusFilter !== "all") {
                const isCompleted = item.status === "completed" || String(item.status) === "2" || item.status === "submitted";
                const isForce = item.status === "force_submitted" || String(item.status) === "3";
                const isIncomplete = item.status === "in_progress" || String(item.status) === "0" || item.status === "expired" || String(item.status) === "1";

                if (statusFilter === "completed" && !isCompleted) return false;
                if (statusFilter === "force_submitted" && !isForce) return false;
                if (statusFilter === "incomplete" && !isIncomplete) return false;
            }

            return true;
        });

        // Sorting
        return list.sort((a, b) => {
            if (sortBy === "score_desc") return b.percentage - a.percentage;
            if (sortBy === "score_asc") return a.percentage - b.percentage;
            if (sortBy === "date_asc") return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
            return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
        });
    }, [initialData.history, searchQuery, statusFilter, sortBy]);

    // Stat calculations
    const stats = useMemo(() => {
        const completedAttempts = initialData.history.filter(
            (item) =>
                (item.status === "completed" ||
                    String(item.status) === "2" ||
                    item.status === "submitted" ||
                    item.status === "force_submitted" ||
                    String(item.status) === "3") &&
                item.is_result_show !== false &&
                item.is_score_show !== false
        );

        let avgScore = 0;
        let highestScore = 0;
        let lowestScore = 0;

        if (completedAttempts.length > 0) {
            const percentages = completedAttempts.map((item) => item.percentage);
            avgScore = percentages.reduce((sum, val) => sum + val, 0) / percentages.length;
            highestScore = Math.max(...percentages);
            lowestScore = Math.min(...percentages);
        }

        return {
            total: initialData.history.length,
            completed: completedAttempts.length,
            average: avgScore.toFixed(1),
            highest: highestScore.toFixed(1),
            lowest: lowestScore.toFixed(1),
        };
    }, [initialData.history]);

    const isFilterActive = searchQuery.trim() !== "" || statusFilter !== "all" || sortBy !== "date_desc";

    function clearFilters() {
        setSearchQuery("");
        setStatusFilter("all");
        setSortBy("date_desc");
    }

    // Recent 6 tests for the visual trend bar
    const trendItems = useMemo(() => {
        const scored = initialData.history.filter(
            (item) =>
                (item.percentage > 0 || item.status === "submitted" || String(item.status) === "2") &&
                item.is_result_show !== false &&
                item.is_score_show !== false
        );
        return [...scored]
            .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
            .slice(-8);
    }, [initialData.history]);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header & Back Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2 -ml-2"
                            nativeButton={false}
                            render={<Link href="/dashboard" />}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Performance Analysis</h1>
                    <p className="text-sm text-muted-foreground">
                        Comprehensive review of your test performance, accuracy trends, and historical records.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 text-xs" nativeButton={false} render={<Link href="/student/history" />}>
                        <Clock className="h-3.5 w-3.5" />
                        Attempt History
                    </Button>
                    <Button variant="default" size="sm" className="gap-2 text-xs shadow-xs" nativeButton={false} render={<Link href="/student/tests" />}>
                        <Layers className="h-3.5 w-3.5" />
                        Take a Test
                    </Button>
                </div>
            </div>

            {/* ── Key Performance KPI Cards ── */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {/* Total Attempts */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Total Tests
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Activity className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.completed} submitted successfully
                        </p>
                    </CardContent>
                </Card>

                {/* Average Accuracy */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Average Score
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.average}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Overall score across all tests
                        </p>
                    </CardContent>
                </Card>

                {/* Highest Score */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Best Performance
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Trophy className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {stats.highest}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Highest percentage scored</p>
                    </CardContent>
                </Card>

                {/* Lowest Score */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Lowest Score
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Award className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">
                            {stats.lowest}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Room for improvement</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Visual Score Progression Bar ── */}
            {trendItems.length > 0 && (
                <Card className="shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Recent Score Progression
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Your scores chronologically across your latest test series attempts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                            {trendItems.map((item) => {
                                const pct = item.percentage;
                                const tierColor =
                                    pct >= 80
                                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                        : pct >= 60
                                        ? "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
                                        : pct >= 40
                                        ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
                                        : "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";

                                return (
                                    <div
                                        key={item.attempt_id}
                                        className={`rounded-xl border p-3 flex flex-col justify-between ${tierColor}`}
                                    >
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold truncate text-foreground" title={item.series_name}>
                                                {item.series_name}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {new Date(item.started_at).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                        <div className="mt-3 flex items-baseline justify-between">
                                            <span className="text-xl font-bold font-mono">{pct}%</span>
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                {item.score}/{item.total_marks}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Filter Controls Bar ── */}
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by assessment name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-8 h-9 text-xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[140px] cursor-pointer"
                    >
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="force_submitted">Force Submitted</option>
                        <option value="incomplete">Incomplete / Active</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[150px] cursor-pointer"
                    >
                        <option value="date_desc">Newest First</option>
                        <option value="date_asc">Oldest First</option>
                        <option value="score_desc">Highest Score</option>
                        <option value="score_asc">Lowest Score</option>
                    </select>

                    {isFilterActive && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Clear filters
                        </Button>
                    )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <span>
                        Showing <strong className="text-foreground">{filteredHistory.length}</strong> of{" "}
                        <strong className="text-foreground">{initialData.history.length}</strong> records
                    </span>
                    {isFilterActive && (
                        <span className="flex items-center gap-1.5 text-primary text-[11px] font-medium">
                            <Filter className="h-3 w-3" />
                            Filtered
                        </span>
                    )}
                </div>
            </div>

            {/* ── Attempts Table ── */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[80px]">Attempt</TableHead>
                            <TableHead>Test Name</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead className="text-right">Percentage</TableHead>
                            <TableHead className="text-center w-[100px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistory.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    No records match your filter criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredHistory.map((item) => {
                                const isCompleted = item.status === "completed" || String(item.status) === "2" || item.status === "submitted";
                                const isForce = item.status === "force_submitted" || String(item.status) === "3";
                                const isInProgress = item.status === "in_progress" || String(item.status) === "0";
                                const canShowResult = item.is_result_show !== false;

                                return (
                                    <TableRow key={item.attempt_id} className="hover:bg-muted/30">
                                        <TableCell className="font-mono text-xs font-semibold">
                                            #{item.attempt_id}
                                        </TableCell>

                                        <TableCell>
                                            <div className="font-medium text-sm text-foreground">
                                                {item.series_name}
                                            </div>
                                            {item.series_code && (
                                                <div className="text-xs font-mono text-muted-foreground">
                                                    Code: {item.series_code}
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDateTime(item.submitted_at || item.started_at)}
                                        </TableCell>

                                        <TableCell>
                                            {isInProgress ? (
                                                <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                    In progress
                                                </Badge>
                                            ) : isForce ? (
                                                <Badge variant="outline" className="text-[10px] border-destructive/40 bg-destructive/10 text-destructive">
                                                    Force Submitted
                                                </Badge>
                                            ) : isCompleted ? (
                                                <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                                    Completed
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                                    {item.status}
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right font-mono font-medium text-sm">
                                            {canShowResult && item.is_score_show !== false ? (
                                                <>
                                                    {item.score} <span className="text-muted-foreground text-xs font-normal">/ {item.total_marks}</span>
                                                </>
                                            ) : (
                                                <span className="text-xs text-muted-foreground font-normal">Pending</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                                {canShowResult && item.is_score_show !== false ? (
                                                    <span className="font-mono font-bold text-sm">
                                                        {item.percentage}%
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Pending</span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {canShowResult ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs gap-1 font-medium text-primary hover:text-primary cursor-pointer"
                                                    nativeButton={false}
                                                    render={<Link href={`/student/attempts/${item.attempt_id}`} />}
                                                >
                                                    Review
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                    Pending
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
