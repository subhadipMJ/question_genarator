"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
    ArrowLeft,
    Search,
    Users,
    CheckCircle2,
    Clock,
    Trophy,
    ExternalLink,
    X,
    Filter,
    Copy,
    QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import QRCodeModal from "../../qr-code-modal";
import type { TestSeriesResults, TestSeriesResultItem } from "../../../services/test-series";

export default function ResultsViewer({
    initialResults,
}: {
    initialResults: TestSeriesResults;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "in_progress">("all");
    const [sortBy, setSortBy] = useState<"score_desc" | "score_asc" | "date_desc" | "name_asc">("date_desc");
    const [isQROpen, setIsQROpen] = useState(false);
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") setOrigin(window.location.origin);
    }, []);

    // Filter and sort results
    const filteredResults = useMemo(() => {
        const list = initialResults.results.filter((item) => {
            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const nameMatch = item.student_name.toLowerCase().includes(q);
                const emailMatch = item.student_email.toLowerCase().includes(q);
                if (!nameMatch && !emailMatch) return false;
            }

            // Status filter
            if (statusFilter !== "all") {
                if (item.status !== statusFilter) return false;
            }

            return true;
        });

        // Sorting
        return list.sort((a, b) => {
            if (sortBy === "score_desc") return b.score - a.score;
            if (sortBy === "score_asc") return a.score - b.score;
            if (sortBy === "name_asc") return a.student_name.localeCompare(b.student_name);
            return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
        });
    }, [initialResults.results, searchQuery, statusFilter, sortBy]);

    // Top score calculation
    const topScore = useMemo(() => {
        if (initialResults.results.length === 0) return 0;
        return Math.max(...initialResults.results.map((r) => r.score));
    }, [initialResults.results]);

    const isFilterActive = searchQuery.trim() !== "" || statusFilter !== "all" || sortBy !== "date_desc";

    function clearFilters() {
        setSearchQuery("");
        setStatusFilter("all");
        setSortBy("date_desc");
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header & Back Button */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/test-series" />}
                        className="mb-2 h-8 text-xs gap-1.5 pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Test Series
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">{initialResults.series_name}</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Student attempt history, scores, and performance analytics.
                    </p>
                </div>

                {/* Invite Link & QR Code buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const tokenToShare = initialResults.invite_token || String(initialResults.series_id);
                            const url = `${origin || (typeof window !== "undefined" ? window.location.origin : "")}/student/join#token=${tokenToShare}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Invite link copied to clipboard!");
                        }}
                        className="h-9 text-xs gap-1.5 font-medium"
                    >
                        <Copy className="h-3.5 w-3.5 text-primary" />
                        Copy Invite Link
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsQROpen(true)}
                        className="h-9 text-xs gap-1.5 font-medium"
                    >
                        <QrCode className="h-3.5 w-3.5 text-primary" />
                        QR Code
                    </Button>
                </div>
            </div>

            <QRCodeModal
                isOpen={isQROpen}
                onClose={() => setIsQROpen(false)}
                seriesName={initialResults.series_name}
                inviteToken={initialResults.invite_token || String(initialResults.series_id)}
                origin={origin}
            />



            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Students Attempted</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{initialResults.total_attempts}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total student attempts started</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Completed Submissions</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {initialResults.completed_attempts}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {initialResults.total_attempts > 0
                                ? `${Math.round((initialResults.completed_attempts / initialResults.total_attempts) * 100)}% completion rate`
                                : "No attempts yet"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Average Score</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{initialResults.average_score}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all completed attempts</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Highest Score</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{topScore}</div>
                        <p className="text-xs text-muted-foreground mt-1">Best performance achieved</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search student name / email */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by student name or email..."
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
                        <option value="submitted">Completed</option>
                        <option value="in_progress">In Progress</option>
                    </select>

                    {/* Sort Order */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
                    >
                        <option value="date_desc">Newest Attempt First</option>
                        <option value="score_desc">Highest Score</option>
                        <option value="score_asc">Lowest Score</option>
                        <option value="name_asc">Student Name (A-Z)</option>
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
                        Showing <strong className="text-foreground font-semibold">{filteredResults.length}</strong> of{" "}
                        <strong className="text-foreground font-semibold">{initialResults.results.length}</strong> student attempts
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
            {filteredResults.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center bg-card">
                    <p className="text-muted-foreground text-sm">No student attempts found for this test series.</p>
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
                                <TableHead className="px-4 py-3 min-w-[200px]">Student</TableHead>
                                <TableHead className="px-4 py-3 w-32">Status</TableHead>
                                <TableHead className="px-4 py-3 w-40">Score & Marks</TableHead>
                                <TableHead className="px-4 py-3 w-36">Percentage</TableHead>
                                <TableHead className="px-4 py-3 w-44">Started At</TableHead>
                                <TableHead className="px-4 py-3 w-44">Submitted At</TableHead>
                                <TableHead className="px-4 py-3 w-28 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {filteredResults.map((item) => {
                                const isSubmitted = item.status === "submitted";
                                const isInProgress = item.status === "in_progress";

                                // Badge color based on percentage
                                let pctBadgeColor = "bg-muted text-muted-foreground";
                                if (isSubmitted) {
                                    if (item.percentage >= 70) pctBadgeColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
                                    else if (item.percentage >= 40) pctBadgeColor = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
                                    else pctBadgeColor = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
                                }

                                return (
                                    <TableRow key={item.attempt_id} className="hover:bg-muted/10 transition-colors">
                                        {/* Student Info */}
                                        <TableCell className="px-4 py-3.5">
                                            <div className="font-medium text-foreground">{item.student_name}</div>
                                            <div className="text-muted-foreground text-[11px] font-mono">{item.student_email}</div>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="px-4 py-3.5">
                                            {isSubmitted ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                                                    Completed
                                                </Badge>
                                            ) : isInProgress ? (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-none">
                                                    In progress
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">{item.status}</Badge>
                                            )}
                                        </TableCell>

                                        {/* Score */}
                                        <TableCell className="px-4 py-3.5 font-medium">
                                            {isSubmitted ? (
                                                <span>
                                                    <strong className="text-primary text-sm font-bold">{item.score}</strong> / {item.total_marks}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>

                                        {/* Percentage */}
                                        <TableCell className="px-4 py-3.5">
                                            {isSubmitted ? (
                                                <Badge variant="outline" className={`font-semibold ${pctBadgeColor}`}>
                                                    {item.percentage}%
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>

                                        {/* Dates */}
                                        <TableCell className="px-4 py-3.5 text-muted-foreground">
                                            {new Date(item.started_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5 text-muted-foreground">
                                            {item.submitted_at ? new Date(item.submitted_at).toLocaleString() : "Not submitted"}
                                        </TableCell>

                                        {/* Action */}
                                        <TableCell className="px-4 py-3.5 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                nativeButton={false}
                                                render={<Link href={`/student/attempts/${item.attempt_id}`} />}
                                                className="h-8 text-xs gap-1 font-normal text-muted-foreground hover:text-foreground"
                                                title="View student attempt details"
                                            >
                                                View
                                                <ExternalLink className="h-3 w-3" />
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
