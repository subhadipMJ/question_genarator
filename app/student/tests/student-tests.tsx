"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Search, X, Tag, Filter, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginatedTests, AttemptSummary } from "./page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.ceil((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

type StudentTestsProps = {
    paginatedTests: PaginatedTests;
    history: AttemptSummary[];
    organizations?: Record<number, string>;
    allTopicNames?: string[];
    initialParams: {
        q: string;
        topic: string;
        org_id: string;
        sort_order: string;
        page: number;
        limit: number;
    };
};

export default function StudentTests({
    paginatedTests,
    history,
    organizations = {},
    allTopicNames = [],
    initialParams,
}: StudentTestsProps) {
    const [busy, setBusy] = useState<number | null>(null);
    const [pendingTestId, setPendingTestId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState(initialParams.q);
    const [selectedTopic, setSelectedTopic] = useState(initialParams.topic);
    const [selectedOrg, setSelectedOrg] = useState(initialParams.org_id);
    const [sortOrder, setSortOrder] = useState(initialParams.sort_order);
    const [pageSize, setPageSize] = useState(initialParams.limit);

    const router = useRouter();

    // Build a map: series_id → most recent attempt
    const attemptBySeriesId = useMemo(() => {
        const map = new Map<number, AttemptSummary>();
        for (const a of history) {
            const existing = map.get(a.series_id);
            if (!existing || a.id > existing.id) {
                map.set(a.series_id, a);
            }
        }
        return map;
    }, [history]);

    // Available topic names
    const availableTopics = useMemo(() => {
        const set = new Set<string>(allTopicNames);
        for (const t of paginatedTests.items) {
            if (t.topics) {
                for (const tp of t.topics) {
                    if (tp) set.add(tp);
                }
            }
        }
        return Array.from(set).sort();
    }, [paginatedTests.items, allTopicNames]);

    // Available organization list
    const availableOrgs = useMemo(() => {
        const orgsMap = new Map<string, string>();
        for (const t of paginatedTests.items) {
            const idStr = String(t.org_id);
            const name = t.org_id === 0 ? "QMaster" : organizations[t.org_id] ?? `Organization #${t.org_id}`;
            orgsMap.set(idStr, name);
        }
        return Array.from(orgsMap.entries()).map(([id, name]) => ({ id, name }));
    }, [paginatedTests.items, organizations]);

    // Filter unattempted items from current page
    const availableItems = useMemo(() => {
        return paginatedTests.items.filter((t) => {
            const existing = attemptBySeriesId.get(t.id);
            return !existing || existing.status === "in_progress";
        });
    }, [paginatedTests.items, attemptBySeriesId]);

    const isFilterActive =
        searchQuery.trim() !== "" ||
        selectedTopic !== "" ||
        selectedOrg !== "" ||
        sortOrder !== "asc";

    function updateBackendQuery(newParams: {
        q?: string;
        topic?: string;
        org_id?: string;
        sort_order?: string;
        page?: number;
        limit?: number;
    }) {
        const q = newParams.q !== undefined ? newParams.q : searchQuery;
        const topic = newParams.topic !== undefined ? newParams.topic : selectedTopic;
        const org_id = newParams.org_id !== undefined ? newParams.org_id : selectedOrg;
        const sort_order = newParams.sort_order !== undefined ? newParams.sort_order : sortOrder;
        const page = newParams.page !== undefined ? newParams.page : paginatedTests.page;
        const limit = newParams.limit !== undefined ? newParams.limit : pageSize;

        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (topic) params.set("topic", topic);
        if (org_id) params.set("org_id", org_id);
        if (sort_order && sort_order !== "asc") params.set("sort_order", sort_order);
        if (page > 1) params.set("page", String(page));
        if (limit !== 10) params.set("limit", String(limit));

        router.push(`/student/tests?${params.toString()}`);
    }

    function handleSearchChange(value: string) {
        setSearchQuery(value);
        updateBackendQuery({ q: value, page: 1 });
    }

    function handleTopicChange(value: string) {
        setSelectedTopic(value);
        updateBackendQuery({ topic: value, page: 1 });
    }

    function handleOrgChange(value: string) {
        setSelectedOrg(value);
        updateBackendQuery({ org_id: value, page: 1 });
    }

    function handleSortChange(value: string) {
        setSortOrder(value);
        updateBackendQuery({ sort_order: value, page: 1 });
    }

    function handleLimitChange(value: number) {
        setPageSize(value);
        updateBackendQuery({ limit: value, page: 1 });
    }

    function handlePageChange(newPage: number) {
        updateBackendQuery({ page: newPage });
    }

    function clearFilters() {
        setSearchQuery("");
        setSelectedTopic("");
        setSelectedOrg("");
        setSortOrder("asc");
        router.push("/student/tests");
    }

    async function start(seriesId: number) {
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

    if (paginatedTests.total === 0 && !isFilterActive) {
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
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Available tests</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Explore available assessments and start your test.
                    </p>
                </div>
            </div>

            {/* ── Backend Filter & Sort Controls Bar ── */}
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Topic / Name */}
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by test name or topic..."
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

                    {/* Select Topic Dropdown */}
                    <select
                        value={selectedTopic}
                        onChange={(e) => handleTopicChange(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[140px]"
                    >
                        <option value="">All Topics</option>
                        {availableTopics.map((topicName) => (
                            <option key={topicName} value={topicName}>
                                {topicName}
                            </option>
                        ))}
                    </select>

                    {/* Select Organization Dropdown */}
                    <select
                        value={selectedOrg}
                        onChange={(e) => handleOrgChange(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring min-w-[150px]"
                    >
                        <option value="">All Organizations</option>
                        {availableOrgs.map((org) => (
                            <option key={org.id} value={org.id}>
                                {org.name}
                            </option>
                        ))}
                    </select>

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
                        Showing <strong className="text-foreground font-semibold">{availableItems.length}</strong> of{" "}
                        <strong className="text-foreground font-semibold">{paginatedTests.total}</strong> total tests (Backend Paginated)
                    </span>
                    {isFilterActive && (
                        <span className="flex items-center gap-1.5 text-primary text-[11px]">
                            <Filter className="h-3 w-3" />
                            Backend SQL Filters Active
                        </span>
                    )}
                </div>
            </div>

            {/* ── Test Grid ── */}
            {availableItems.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center bg-card">
                    <p className="text-muted-foreground text-sm">No tests match your filter criteria.</p>
                    <Button variant="outline" size="sm" className="mt-4 gap-2 text-xs" onClick={clearFilters}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset filters
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {availableItems.map((t) => {
                        const existingAttempt = attemptBySeriesId.get(t.id);
                        const isInProgress = existingAttempt?.status === "in_progress";
                        const isSubmitted = existingAttempt?.status === "submitted";
                        const isExpired = new Date(t.valid_until) < new Date();
                        const orgName = t.org_id === 0 ? "QMaster" : organizations[t.org_id] ?? `Organization #${t.org_id}`;

                        return (
                            <Card key={t.id} className="relative overflow-hidden flex flex-col justify-between">
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

                                <CardHeader className="pl-5 pb-3">
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

                                    {/* Topic Badges */}
                                    {t.topics && t.topics.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-2">
                                            {t.topics.map((tp) => (
                                                <Badge
                                                    key={tp}
                                                    variant="outline"
                                                    className="text-[11px] font-normal bg-muted/40 gap-1 text-muted-foreground"
                                                >
                                                    <Tag className="h-3 w-3 text-primary/70" />
                                                    {tp}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
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
            )}

            {/* ── Pagination Footer ── */}
            {paginatedTests.total_pages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                    <p className="text-xs text-muted-foreground">
                        Showing page <span className="font-semibold text-foreground">{paginatedTests.page}</span> of{" "}
                        <span className="font-semibold text-foreground">{paginatedTests.total_pages}</span> (
                        <span className="font-semibold">{paginatedTests.total}</span> total tests)
                    </p>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={paginatedTests.page <= 1}
                            onClick={() => handlePageChange(paginatedTests.page - 1)}
                            className="h-8 gap-1 text-xs"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: paginatedTests.total_pages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === paginatedTests.page ? "default" : "outline"}
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
                            disabled={paginatedTests.page >= paginatedTests.total_pages}
                            onClick={() => handlePageChange(paginatedTests.page + 1)}
                            className="h-8 gap-1 text-xs"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}



