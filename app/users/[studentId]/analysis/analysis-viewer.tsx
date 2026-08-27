"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, CheckCircle2, Clock, Trophy, ExternalLink, X, Filter, Eye, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { StudentHistoryResponse } from "../../../services/users";

function formatDateTime(value: string | null) {
    if (!value) return "Not submitted";
    const date = new Date(value);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

export default function AnalysisViewer({
    initialData,
}: {
    initialData: StudentHistoryResponse;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "incomplete" | "force_submitted">("all");
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
                const isIncomplete = item.status === "in_progress" || String(item.status) === "0" || item.status === "incomplete" || item.status === "expired" || String(item.status) === "1";

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
        const completedAttempts = initialData.history.filter((item) => item.status === "completed" || String(item.status) === "2" || item.status === "submitted" || item.status === "force_submitted" || String(item.status) === "3");
        
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

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header & Back Button */}
            <div className="flex flex-col gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/users" />}
                    className="w-fit h-8 text-xs gap-1.5 pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Users
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{initialData.student_name}</h1>
                    <p className="text-muted-foreground text-sm mt-1 font-mono">
                        {initialData.student_email}
                    </p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Tests Attempted</CardTitle>
                        <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{initialData.total_tests}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Completed Tests</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.completed}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Average Score</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.average}%</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Highest Score</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{stats.highest}%</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Lowest Score</CardTitle>
                        <Activity className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.lowest}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by test series name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-8 h-9 text-xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[140px]"
                    >
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="incomplete">Incomplete</option>
                        <option value="force_submitted">Force Submitted</option>
                    </select>

                    {/* Sort Order */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
                    >
                        <option value="date_desc">Newest Attempt First</option>
                        <option value="date_asc">Oldest Attempt First</option>
                        <option value="score_desc">Highest Score</option>
                        <option value="score_asc">Lowest Score</option>
                    </select>

                    {/* Clear Filters */}
                    {isFilterActive && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
                        >
                            <X className="h-3.5 w-3.5" />
                            Clear filters
                        </Button>
                    )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <span>
                        Showing <strong className="text-foreground font-semibold">{filteredHistory.length}</strong> of{" "}
                        <strong className="text-foreground font-semibold">{initialData.history.length}</strong> attempts
                    </span>
                    {isFilterActive && (
                        <span className="flex items-center gap-1.5 text-primary text-[11px]">
                            <Filter className="h-3 w-3" />
                            Filters active
                        </span>
                    )}
                </div>
            </div>

            {/* Results Table */}
            {filteredHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center bg-card">
                    <p className="text-muted-foreground text-sm">No test attempts found for this student.</p>
                    {isFilterActive && (
                        <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="px-4 py-3 min-w-[200px]">Test Series</TableHead>
                                <TableHead className="px-4 py-3 w-32">Status</TableHead>
                                <TableHead className="px-4 py-3 w-40">Score & Marks</TableHead>
                                <TableHead className="px-4 py-3 w-36">Percentage</TableHead>
                                <TableHead className="px-4 py-3 w-44">Started At</TableHead>
                                <TableHead className="px-4 py-3 w-44">Submitted At</TableHead>
                                <TableHead className="px-4 py-3 w-32 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {filteredHistory.map((item) => {
                                const isSubmitted = item.status === "completed" || item.status === "submitted" || String(item.status) === "2";
                                const isForceSubmitted = item.status === "force_submitted" || String(item.status) === "3";
                                const isInProgress = item.status === "in_progress" || String(item.status) === "0";
                                const isExpiredItem = item.status === "expired" || String(item.status) === "1";
                                const isFinished = isSubmitted || isForceSubmitted;

                                // Badge color based on percentage
                                let pctBadgeColor = "bg-muted text-muted-foreground";
                                if (isFinished) {
                                    if (item.percentage >= 70) pctBadgeColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
                                    else if (item.percentage >= 40) pctBadgeColor = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
                                    else pctBadgeColor = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
                                }

                                return (
                                    <TableRow key={item.attempt_id} className="hover:bg-muted/10 transition-colors">
                                        {/* Series Info */}
                                        <TableCell className="px-4 py-3.5">
                                            <div className="font-medium text-foreground">{item.series_name}</div>
                                            {item.series_code && (
                                                <div className="text-muted-foreground text-[11px] font-mono">{item.series_code}</div>
                                            )}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="px-4 py-3.5">
                                            {isForceSubmitted ? (
                                                <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20 font-medium">
                                                    Force Submitted
                                                </Badge>
                                            ) : isSubmitted ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                                                    Completed
                                                </Badge>
                                            ) : isInProgress ? (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-none">
                                                    In progress
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">{isExpiredItem ? "Expired" : String(item.status)}</Badge>
                                            )}
                                        </TableCell>

                                        {/* Score */}
                                        <TableCell className="px-4 py-3.5 font-medium">
                                            {isFinished ? (
                                                <span>
                                                    <strong className="text-primary text-sm font-bold">{item.score}</strong> / {item.total_marks}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>

                                        {/* Percentage */}
                                        <TableCell className="px-4 py-3.5">
                                            {isFinished ? (
                                                <Badge variant="outline" className={`font-semibold ${pctBadgeColor}`}>
                                                    {item.percentage}%
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>

                                        {/* Dates */}
                                        <TableCell className="px-4 py-3.5 text-muted-foreground">
                                            {formatDateTime(item.started_at)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5 text-muted-foreground">
                                            {formatDateTime(item.submitted_at)}
                                        </TableCell>

                                         {/* Action */}
                                         <TableCell className="px-4 py-3.5 text-right">
                                             <Button
                                                 variant="outline"
                                                 size="sm"
                                                 nativeButton={false}
                                                 render={<Link href={`/student/attempts/${item.attempt_id}`} target="_blank" />}
                                                 className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
                                                 title="View student choices and attempt details"
                                             >
                                                 <Eye className="h-3.5 w-3.5 text-primary" />
                                                 View Responses
                                             </Button>
                                         </TableCell>
                                     </TableRow>
                                 );
                             })}
                         </TableBody>
                     </Table>
                 </div>
             )}
        </div>
    );
}
