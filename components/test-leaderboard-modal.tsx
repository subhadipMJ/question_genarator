"use client";

import { useEffect, useState } from "react";
import {
    Trophy,
    Medal,
    Award,
    TrendingUp,
    Clock,
    X,
    Loader2,
    RefreshCw,
    AlertCircle,
    User,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
    TestSeriesLeaderboardResponse,
    LeaderboardEntry,
} from "@/app/services/student";

export interface TestLeaderboardModalProps {
    isOpen: boolean;
    seriesId: number;
    seriesName: string;
    onClose: () => void;
}

function formatDuration(seconds?: number | null): string {
    if (!seconds || seconds <= 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export default function TestLeaderboardModal({
    isOpen,
    seriesId,
    seriesName,
    onClose,
}: TestLeaderboardModalProps) {
    const [data, setData] = useState<TestSeriesLeaderboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadLeaderboard = async () => {
        if (!seriesId) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/backend/student/test-series/${seriesId}/leaderboard`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to load leaderboard");
            }
            const res = (await response.json()) as TestSeriesLeaderboardResponse;
            setData(res);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load leaderboard");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            void loadLeaderboard();
        } else {
            setData(null);
            setError(null);
        }
    }, [isOpen, seriesId]);

    if (!isOpen) return null;

    const topThree = data?.leaderboard.slice(0, 3) || [];

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
        >
            <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Trophy className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-foreground">
                                Test Leaderboard & Ranking
                            </h2>
                            <p className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-md">
                                {seriesName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void loadLeaderboard()}
                            disabled={isLoading}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Refresh"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm">Calculating rankings and percentiles…</p>
                        </div>
                    )}

                    {!isLoading && error && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
                            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                            <p className="text-sm text-destructive font-medium">{error}</p>
                            <Button size="sm" variant="outline" onClick={() => void loadLeaderboard()}>
                                Try Again
                            </Button>
                        </div>
                    )}

                    {!isLoading && !error && data && !data.is_result_show && (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-3">
                            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400 mx-auto" />
                            <h3 className="text-lg font-bold">Results Not Announced Yet</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                                The rankings and leaderboard for this test will be made visible once the results are published by the teacher.
                            </p>
                        </div>
                    )}

                    {!isLoading && !error && data && data.is_result_show && (
                        <>
                            {/* Student's Personal Rank & Percentile Banner */}
                            {data.my_rank ? (
                                <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
                                        <div className="space-y-0.5">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                Your Rank
                                            </span>
                                            <div className="flex items-baseline justify-center sm:justify-start gap-1">
                                                <span className="text-2xl font-black text-primary">
                                                    #{data.my_rank}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    / {data.total_candidates}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-0.5">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                Percentile
                                            </span>
                                            <div className="text-2xl font-black text-foreground">
                                                {data.my_percentile !== null && data.my_percentile !== undefined
                                                    ? `${data.my_percentile}%`
                                                    : "—"}
                                            </div>
                                        </div>

                                        <div className="space-y-0.5">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                Your Score
                                            </span>
                                            <div className="text-2xl font-black text-foreground">
                                                {data.my_score ?? 0}{" "}
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    / {data.total_marks}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-0.5">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                Batch Average
                                            </span>
                                            <div className="text-2xl font-bold text-muted-foreground">
                                                {data.average_score ?? 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground text-center">
                                    You have not submitted an attempt for this test series.
                                </div>
                            )}

                            {/* Top 3 Podium Cards */}
                            {topThree.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                    {topThree.map((item, idx) => {
                                        const medals = [
                                            {
                                                label: "1st Place",
                                                border: "border-amber-500/40 bg-amber-500/5",
                                                badge: "bg-amber-500 text-white",
                                                icon: "🥇",
                                            },
                                            {
                                                label: "2nd Place",
                                                border: "border-slate-400/40 bg-slate-400/5",
                                                badge: "bg-slate-400 text-white",
                                                icon: "🥈",
                                            },
                                            {
                                                label: "3rd Place",
                                                border: "border-amber-700/40 bg-amber-700/5",
                                                badge: "bg-amber-700 text-white",
                                                icon: "🥉",
                                            },
                                        ];
                                        const m = medals[idx] || medals[0];

                                        return (
                                            <div
                                                key={item.student_id}
                                                className={`rounded-xl border p-4 text-center space-y-2 relative transition-all ${m.border} ${
                                                    item.is_current_user ? "ring-2 ring-primary" : ""
                                                }`}
                                            >
                                                <div className="text-2xl">{m.icon}</div>
                                                <div>
                                                    <div className="font-bold text-sm text-foreground truncate">
                                                        {item.student_name}
                                                        {item.is_current_user && " (You)"}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.score} / {item.total_marks} ({item.percentage}%)
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                                                    Rank #{item.rank}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Full Leaderboard Table */}
                            <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[70px] text-center">Rank</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead className="text-right">Score</TableHead>
                                            <TableHead className="text-right">Percentage</TableHead>
                                            <TableHead className="text-right hidden sm:table-cell">
                                                Time Taken
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.leaderboard.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No completed submissions yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.leaderboard.map((item) => (
                                                <TableRow
                                                    key={item.student_id}
                                                    className={
                                                        item.is_current_user
                                                            ? "bg-primary/10 font-medium hover:bg-primary/15"
                                                            : "hover:bg-muted/30"
                                                    }
                                                >
                                                    <TableCell className="text-center">
                                                        {item.rank === 1 ? (
                                                            <span className="font-bold text-amber-500">🥇 1</span>
                                                        ) : item.rank === 2 ? (
                                                            <span className="font-bold text-slate-400">🥈 2</span>
                                                        ) : item.rank === 3 ? (
                                                            <span className="font-bold text-amber-700">🥉 3</span>
                                                        ) : (
                                                            <span className="font-mono text-xs font-semibold text-muted-foreground">
                                                                #{item.rank}
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs sm:text-sm text-foreground">
                                                                {item.student_name}
                                                            </span>
                                                            {item.is_current_user && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-[10px] bg-primary text-primary-foreground font-semibold px-1.5 py-0"
                                                                >
                                                                    You
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-right font-mono text-xs sm:text-sm font-semibold">
                                                        {item.score}{" "}
                                                        <span className="text-muted-foreground text-[11px] font-normal">
                                                            / {item.total_marks}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-right font-mono text-xs sm:text-sm font-bold">
                                                        {item.percentage}%
                                                    </TableCell>

                                                    <TableCell className="text-right text-xs text-muted-foreground hidden sm:table-cell">
                                                        {formatDuration(item.time_taken_seconds)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/20 text-xs text-muted-foreground">
                    <span>
                        {data?.total_candidates
                            ? `Total candidates: ${data.total_candidates}`
                            : "Batch Leaderboard"}
                    </span>
                    <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
