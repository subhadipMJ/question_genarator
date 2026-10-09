"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
    Search,
    X,
    RotateCcw,
    Filter,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export type History = {
    id: number;
    series_name: string;
    started_at: string;
    submitted_at: string | null;
    status: number | string;
    score: string;
    total_marks: string;
    is_result_show?: boolean;
    is_score_show?: boolean;
};

type QuickTab = "all" | "result_out" | "result_pending" | "submitted" | "force_submitted";

function getAttemptStatusKey(a: History): "submitted" | "force_submitted" | "in_progress" | "expired" {
    if (a.status === "force_submitted" || a.status === 3) return "force_submitted";
    if (a.status === "submitted" || a.status === 2) return "submitted";
    if (a.status === "in_progress" || a.status === 0) return "in_progress";
    if (a.status === "expired" || a.status === 1) return "expired";
    return "submitted";
}

export function HistorySearch({ allHistory }: { allHistory: History[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<QuickTab>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [resultFilter, setResultFilter] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<string>("newest");
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Counts for quick tabs
    const counts = useMemo(() => {
        let resultOut = 0;
        let resultPending = 0;
        let submitted = 0;
        let forceSubmitted = 0;

        for (const a of allHistory) {
            const st = getAttemptStatusKey(a);
            const canViewResult = a.is_result_show !== false;

            if (st !== "in_progress") {
                if (canViewResult) resultOut++;
                else resultPending++;
            }
            if (st === "submitted") submitted++;
            if (st === "force_submitted") forceSubmitted++;
        }

        return {
            all: allHistory.length,
            resultOut,
            resultPending,
            submitted,
            forceSubmitted,
        };
    }, [allHistory]);

    // Handle quick tab changes
    function handleTabChange(tab: QuickTab) {
        setActiveTab(tab);
        setCurrentPage(1);
    }

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let items = [...allHistory];

        // 1. Quick tab filter
        if (activeTab === "result_out") {
            items = items.filter((a) => a.is_result_show !== false && getAttemptStatusKey(a) !== "in_progress");
        } else if (activeTab === "result_pending") {
            items = items.filter((a) => a.is_result_show === false && getAttemptStatusKey(a) !== "in_progress");
        } else if (activeTab === "submitted") {
            items = items.filter((a) => getAttemptStatusKey(a) === "submitted");
        } else if (activeTab === "force_submitted") {
            items = items.filter((a) => getAttemptStatusKey(a) === "force_submitted");
        }

        // 2. Dropdown Status filter
        if (statusFilter !== "all") {
            items = items.filter((a) => getAttemptStatusKey(a) === statusFilter);
        }

        // 3. Dropdown Result filter
        if (resultFilter === "out") {
            items = items.filter((a) => a.is_result_show !== false && getAttemptStatusKey(a) !== "in_progress");
        } else if (resultFilter === "not_out") {
            items = items.filter((a) => a.is_result_show === false && getAttemptStatusKey(a) !== "in_progress");
        }

        // 4. Text search query
        const query = searchQuery.trim().toLowerCase();
        if (query) {
            items = items.filter(
                (a) =>
                    a.series_name.toLowerCase().includes(query) ||
                    String(a.id).includes(query)
            );
        }

        // 5. Sorting
        items.sort((a, b) => {
            if (sortOrder === "newest") {
                const dateA = new Date(a.submitted_at || a.started_at).getTime();
                const dateB = new Date(b.submitted_at || b.started_at).getTime();
                return dateB - dateA;
            }
            if (sortOrder === "oldest") {
                const dateA = new Date(a.started_at).getTime();
                const dateB = new Date(b.started_at).getTime();
                return dateA - dateB;
            }
            if (sortOrder === "highest_score") {
                const scoreA = Number(a.score) || 0;
                const scoreB = Number(b.score) || 0;
                return scoreB - scoreA;
            }
            if (sortOrder === "lowest_score") {
                const scoreA = Number(a.score) || 0;
                const scoreB = Number(b.score) || 0;
                return scoreA - scoreB;
            }
            if (sortOrder === "alpha") {
                return a.series_name.localeCompare(b.series_name);
            }
            return 0;
        });

        return items;
    }, [allHistory, activeTab, statusFilter, resultFilter, searchQuery, sortOrder]);

    const isFilterActive =
        searchQuery.trim() !== "" ||
        activeTab !== "all" ||
        statusFilter !== "all" ||
        resultFilter !== "all" ||
        sortOrder !== "newest";

    function clearFilters() {
        setSearchQuery("");
        setActiveTab("all");
        setStatusFilter("all");
        setResultFilter("all");
        setSortOrder("newest");
        setCurrentPage(1);
    }

    // Pagination slice
    const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredItems.slice(start, start + pageSize);
    }, [filteredItems, currentPage, pageSize]);

    return (
        <div className="space-y-6">
            {/* ── Header with Title & Quick Tabs ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attempt history</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Review your completed assessments, scores, result declarations, and answer keys.
                    </p>
                </div>

                {/* Quick Filter Pill Switcher (Matches Available Tests layout) */}
                <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 flex-wrap">
                    <button
                        type="button"
                        onClick={() => handleTabChange("all")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === "all"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <span>All Attempts</span>
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            {counts.all}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange("result_out")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === "result_out"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <span>Result Out</span>
                        <Badge
                            variant={activeTab === "result_out" ? "outline" : "secondary"}
                            className="px-1.5 py-0 text-[10px]"
                        >
                            {counts.resultOut}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange("result_pending")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === "result_pending"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <span>Result Pending</span>
                        <Badge
                            variant={activeTab === "result_pending" ? "outline" : "secondary"}
                            className="px-1.5 py-0 text-[10px]"
                        >
                            {counts.resultPending}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange("submitted")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === "submitted"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <span>Completed</span>
                        <Badge
                            variant={activeTab === "submitted" ? "outline" : "secondary"}
                            className="px-1.5 py-0 text-[10px]"
                        >
                            {counts.submitted}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange("force_submitted")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === "force_submitted"
                                ? "bg-destructive text-destructive-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <span>Force Submitted</span>
                        <Badge
                            variant={activeTab === "force_submitted" ? "outline" : "secondary"}
                            className="px-1.5 py-0 text-[10px]"
                        >
                            {counts.forceSubmitted}
                        </Badge>
                    </button>
                </div>
            </div>

            {/* ── Filter & Sort Controls Bar (Matches Available Tests Controls Bar) ── */}
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Topic / Name */}
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by test name or attempt #..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9 pr-8 h-9 text-xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setCurrentPage(1);
                                }}
                                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Result Announcement Filter Dropdown */}
                    <select
                        value={resultFilter}
                        onChange={(e) => {
                            setResultFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[140px] cursor-pointer"
                    >
                        <option value="all">All Results (Any)</option>
                        <option value="out">Result Out</option>
                        <option value="not_out">Result Not Out</option>
                    </select>

                    {/* Submission Status Filter Dropdown */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[150px] cursor-pointer"
                    >
                        <option value="all">All Statuses</option>
                        <option value="submitted">Completed / Submitted</option>
                        <option value="force_submitted">Force Submitted</option>
                        <option value="in_progress">In Progress</option>
                        <option value="expired">Expired</option>
                    </select>

                    {/* Sort Order Dropdown */}
                    <select
                        value={sortOrder}
                        onChange={(e) => {
                            setSortOrder(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0 cursor-pointer"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest_score">Highest Score</option>
                        <option value="lowest_score">Lowest Score</option>
                        <option value="alpha">Alphabetical (A–Z)</option>
                    </select>

                    {/* Per Page Select */}
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="h-9 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0 cursor-pointer"
                    >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                    </select>

                    {/* Clear Filters Button */}
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

                {/* Filter info summary footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <span>
                        Showing <strong className="text-foreground font-semibold">{paginatedItems.length}</strong> of{" "}
                        <strong className="text-foreground font-semibold">{filteredItems.length}</strong> attempts
                        {filteredItems.length !== allHistory.length && (
                            <span> (filtered from {allHistory.length} total)</span>
                        )}
                    </span>
                    {isFilterActive && (
                        <span className="flex items-center gap-1.5 text-primary text-[11px] font-medium">
                            <Filter className="h-3 w-3" />
                            Filters Active
                        </span>
                    )}
                </div>
            </div>

            {/* ── Attempt Cards Grid ── */}
            {filteredItems.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center bg-card">
                    <p className="text-muted-foreground text-sm">
                        {allHistory.length === 0
                            ? "You have not attempted any tests yet."
                            : "No attempts match your active filter criteria."}
                    </p>
                    {isFilterActive ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 gap-2 text-xs cursor-pointer"
                            onClick={clearFilters}
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset filters
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            className="mt-4"
                            nativeButton={false}
                            render={<Link href="/student/tests" />}
                        >
                            View available tests
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {paginatedItems.map((a) => {
                        const st = getAttemptStatusKey(a);
                        const isSubmitted = st === "submitted";
                        const isForceSubmitted = st === "force_submitted";
                        const isInProgress = st === "in_progress";
                        const isExpired = st === "expired";

                        const canViewResult = a.is_result_show !== false;
                        const canViewScore = a.is_score_show !== false;

                        const cardInner = (
                            <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 h-full">
                                <div
                                    className={`absolute inset-y-0 left-0 w-1 rounded-l-xl ${
                                        isExpired
                                            ? "bg-muted-foreground/30"
                                            : isForceSubmitted
                                            ? "bg-destructive"
                                            : isSubmitted
                                            ? "bg-green-500"
                                            : isInProgress
                                            ? "bg-amber-500"
                                            : "bg-primary"
                                    }`}
                                />
                                <CardHeader className="pl-5 pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
                                            {a.series_name}
                                        </CardTitle>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            {isInProgress && (
                                                <Badge
                                                    variant="secondary"
                                                    className="justify-center bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                                >
                                                    In progress
                                                </Badge>
                                            )}
                                            {isForceSubmitted && (
                                                <Badge
                                                    variant="outline"
                                                    className="justify-center border-destructive/40 bg-destructive text-white dark:bg-destructive/20 font-medium"
                                                >
                                                    Force Submitted
                                                </Badge>
                                            )}
                                            {isSubmitted && (
                                                <Badge
                                                    variant="secondary"
                                                    className="justify-center bg-green-500 text-white dark:bg-green-900/30 dark:text-green-400"
                                                >
                                                    Completed
                                                </Badge>
                                            )}
                                            {isExpired && (
                                                <Badge variant="outline" className="justify-center text-muted-foreground">
                                                    Expired
                                                </Badge>
                                            )}

                                            {!isInProgress &&
                                                (canViewResult ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-[11px] gap-1"
                                                    >
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Result Out
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium text-[11px] gap-1"
                                                    >
                                                        <Clock className="h-3 w-3" />
                                                        Result Not Out
                                                    </Badge>
                                                ))}
                                        </div>
                                    </div>
                                    <CardDescription className="text-xs font-mono text-muted-foreground">
                                        Attempt #{a.id}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pl-5 text-[13px] text-muted-foreground space-y-2">
                                    <div className="space-y-0.5">
                                        <p>Started: {new Date(a.started_at).toLocaleString("en-US")}</p>
                                        {a.submitted_at && (
                                            <p>Submitted: {new Date(a.submitted_at).toLocaleString("en-US")}</p>
                                        )}
                                    </div>
                                    <div className="border-t pt-2 flex items-center justify-between">
                                        <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                                            Test Score:
                                        </span>
                                        {canViewScore ? (
                                            <span className="text-sm font-bold text-foreground">
                                                {a.score}{" "}
                                                <span className="text-muted-foreground text-sm font-normal">
                                                    / {a.total_marks}
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-xs italic text-amber-600 dark:text-amber-400 font-medium">
                                                Score Hidden (Result Not Out)
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );

                        if (!canViewResult) {
                            return (
                                <div
                                    key={a.id}
                                    className="group block cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toast.info("Result has not been announced yet by the instructor.");
                                    }}
                                >
                                    {cardInner}
                                </div>
                            );
                        }

                        return (
                            <Link key={a.id} href={`/student/attempts/${a.id}`} className="group block">
                                {cardInner}
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* ── Pagination Controls ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                    <span>
                        Page <strong className="text-foreground">{currentPage}</strong> of{" "}
                        <strong className="text-foreground">{totalPages}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 cursor-pointer"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 cursor-pointer"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                        >
                            Next
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}