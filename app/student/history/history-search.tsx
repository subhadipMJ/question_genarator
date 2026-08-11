"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, Filter, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type History = {
    id: number;
    series_name: string;
    started_at: string;
    submitted_at: string | null;
    status: number | string;
    score: string;
    total_marks: string;
};

export function HistorySearch({ allHistory }: { allHistory: History[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter and sort history
    const filteredHistory = useMemo(() => {
        let filtered = allHistory;

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter((a) =>
                a.series_name.toLowerCase().includes(searchQuery.trim().toLowerCase())
            );
        }

        // Sort by series name
        filtered = filtered.sort((a, b) => {
            const comparison = a.series_name.localeCompare(b.series_name);
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return filtered;
    }, [allHistory, searchQuery, sortOrder]);

    // Pagination
    const totalPages = Math.ceil(filteredHistory.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedHistory = filteredHistory.slice(startIndex, startIndex + pageSize);

    const isFilterActive = searchQuery.trim() !== "" || sortOrder !== "asc";

    function handleSearchChange(value: string) {
        setSearchQuery(value);
        setCurrentPage(1);
    }

    function handleSortChange(value: string) {
        setSortOrder(value);
        setCurrentPage(1);
    }

    function handleLimitChange(value: number) {
        setPageSize(value);
        setCurrentPage(1);
    }

    function handlePageChange(newPage: number) {
        setCurrentPage(newPage);
    }

    function clearFilters() {
        setSearchQuery("");
        setSortOrder("asc");
        setCurrentPage(1);
    }

     return (
        <>
            {/* ── Backend Filter & Sort Controls Bar ── */}
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Topic / Name */}
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by test name..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-9 pr-8 h-9 text-xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => handleSearchChange("")}
                                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Alphabetical Sort Dropdown */}
                    <select
                        value={sortOrder}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
                    >
                        <option value="asc">Alphabetical (A–Z)</option>
                        <option value="desc">Alphabetical (Z–A)</option>
                    </select>

                    {/* Per Page Select */}
                    <select
                        value={pageSize}
                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                        className="h-9 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
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
                            className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Clear filters
                        </Button>
                    )}
                </div>

                {/* Filter info summary */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <span>
                        Showing <strong className="text-foreground font-semibold">{paginatedHistory.length}</strong> of{" "}
                        <strong className="text-foreground font-semibold">{filteredHistory.length}</strong> total attempts (Backend Paginated)
                    </span>
                    {isFilterActive && (
                        <span className="flex items-center gap-1.5 text-primary text-[11px]">
                            <Filter className="h-3 w-3" />
                            Filters Active
                        </span>
                    )}
                </div>
            </div>

            {paginatedHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center bg-card">
                    <p className="text-muted-foreground text-sm">
                        {searchQuery ? `No attempts match "${searchQuery}".` : "You have not attempted any tests yet."}
                    </p>
                    {isFilterActive && (
                        <Button variant="outline" size="sm" className="mt-4 gap-2 text-xs" onClick={clearFilters}>
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset filters
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {paginatedHistory.map((a) => {
                        const isSubmitted = a.status === "submitted" || a.status === 2 || a.status === 3;
                        const isInProgress = a.status === "in_progress" || a.status === 0;
                        const isExpired = a.status === "expired" || a.status === 1;

                        return (
                            <Link key={a.id} href={`/student/attempts/${a.id}`} className="group block">
                                <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 h-full">
                                    <div
                                        className={`absolute inset-y-0 left-0 w-1 rounded-l-xl ${
                                            isExpired
                                                ? "bg-muted-foreground/30"
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
                                            {isExpired && (
                                                <Badge variant="outline" className="shrink-0 text-muted-foreground">
                                                    Expired
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-xs">
                                            Attempt #{a.id}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pl-5 text-xs text-muted-foreground space-y-2">
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
                                            <span className="text-sm font-bold text-foreground">
                                                {a.score} <span className="text-muted-foreground text-xs font-normal">/ {a.total_marks}</span>
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link> 
                        );
                    })}
                </div>
            )}

            {/* ── Pagination Footer ── */}
            {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                    <p className="text-xs text-muted-foreground">
                        Showing page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                        <span className="font-semibold text-foreground">{totalPages}</span> (
                        <span className="font-semibold">{filteredHistory.length}</span> total attempts)
                    </p>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="h-8 gap-1 text-xs"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === currentPage ? "default" : "outline"}
                                    size="icon"
                                    onClick={() => handlePageChange(page)}
                                    className="h-8 w-8 text-xs"
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="h-8 gap-1 text-xs"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}