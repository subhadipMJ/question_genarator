"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Search,
    Bookmark,
    CheckCircle2,
    XCircle,
    AlertCircle,
    HelpCircle,
    RotateCcw,
    Filter,
    ExternalLink,
    Check,
    Sparkles,
    BookOpen,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sanitizeHtmlContent } from "@/lib/sanitize";
import type { RevisionQuestionItem, RevisionQuestionsResponse } from "@/app/services/student";

export interface RevisionViewerProps {
    initialData: RevisionQuestionsResponse;
}

function formatRelativeTime(dateStr?: string | null): string {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return "";
    }
}

export default function RevisionViewer({ initialData }: RevisionViewerProps) {
    const [filterType, setFilterType] = useState<"mistakes" | "unanswered" | "all">("mistakes");
    const [selectedSeries, setSelectedSeries] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Set of question IDs marked as "mastered / resolved" locally by the student
    const [masteredIds, setMasteredIds] = useState<Set<number>>(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("student_mastered_questions");
                if (saved) return new Set(JSON.parse(saved));
            } catch {
                // Ignore parsing errors
            }
        }
        return new Set();
    });

    const toggleMastered = (id: number) => {
        setMasteredIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            try {
                localStorage.setItem("student_mastered_questions", JSON.stringify(Array.from(next)));
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    };

    // Filter questions
    const filteredQuestions = useMemo(() => {
        return initialData.items.filter((item) => {
            // Filter type
            if (filterType === "mistakes" && item.status !== "incorrect") return false;
            if (filterType === "unanswered" && item.status !== "unanswered") return false;

            // Test series filter
            if (selectedSeries !== "all" && String(item.series_id) !== selectedSeries) {
                return false;
            }

            // Keyword search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const inQuestion = item.question_text.toLowerCase().includes(q);
                const inSeries = item.series_name.toLowerCase().includes(q);
                const inOptions = item.options.some((opt) => opt.ans.toLowerCase().includes(q));
                if (!inQuestion && !inSeries && !inOptions) return false;
            }

            return true;
        });
    }, [initialData.items, filterType, selectedSeries, searchQuery]);

    // Counts for tabs
    const counts = useMemo(() => {
        let mistakes = 0;
        let unanswered = 0;
        for (const item of initialData.items) {
            if (item.status === "incorrect") mistakes++;
            else if (item.status === "unanswered") unanswered++;
        }
        return {
            mistakes,
            unanswered,
            all: initialData.items.length,
        };
    }, [initialData.items]);

    const isFilterActive = searchQuery.trim() !== "" || selectedSeries !== "all" || filterType !== "mistakes";

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedSeries("all");
        setFilterType("mistakes");
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6 pb-20">
            {/* Header & Back */}
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
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Dashboard
                        </Button>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                            <Bookmark className="h-5 w-5 fill-current" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Mistake Notebook & Revision Doubts
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Review your incorrect and skipped questions across all tests to reinforce concepts.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 h-9"
                        nativeButton={false}
                        render={<Link href="/student/analysis" />}
                    >
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Performance Analysis
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border-red-500/20 bg-red-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-red-700 dark:text-red-400">Mistakes</span>
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="mt-2 text-2xl font-black text-red-600 dark:text-red-400">
                            {counts.mistakes}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Incorrect answers</p>
                    </CardContent>
                </Card>

                <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Unanswered</span>
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
                            {counts.unanswered}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Skipped in exams</p>
                    </CardContent>
                </Card>

                <Card className="border-emerald-500/20 bg-emerald-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Mastered</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {masteredIds.size}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Revised & cleared</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-primary">Test Sources</span>
                            <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <p className="mt-2 text-2xl font-black text-foreground">
                            {initialData.available_series.length}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Completed tests</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="rounded-xl border bg-card p-4 space-y-3 shadow-xs">
                {/* Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                    <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-1">
                        <button
                            type="button"
                            onClick={() => setFilterType("mistakes")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                filterType === "mistakes"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                            Mistakes ({counts.mistakes})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType("unanswered")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                filterType === "unanswered"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                            Unanswered ({counts.unanswered})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType("all")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                filterType === "all"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <BookOpen className="h-3.5 w-3.5 text-primary" />
                            All Reviewed ({counts.all})
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {isFilterActive && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Search & Series Dropdown */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search question text or options…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>

                    {initialData.available_series.length > 0 && (
                        <select
                            value={selectedSeries}
                            onChange={(e) => setSelectedSeries(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-[220px] cursor-pointer"
                        >
                            <option value="all">All Test Series</option>
                            {initialData.available_series.map((s) => (
                                <option key={s.id} value={String(s.id)}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Questions List */}
            {filteredQuestions.length === 0 ? (
                <div className="rounded-2xl border bg-muted/20 p-12 text-center space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                        {initialData.items.length === 0
                            ? "No Revision Questions Yet"
                            : "No questions match your filter"}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                        {initialData.items.length === 0
                            ? "Great job! As you take tests and results are announced, any questions you get wrong or skip will automatically appear here for revision."
                            : "Try adjusting your search query or switching tabs to view other questions."}
                    </p>
                    {isFilterActive && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs">
                            Reset Filters
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-5">
                    {filteredQuestions.map((q, idx) => {
                        const isMastered = masteredIds.has(q.id);

                        return (
                            <Card
                                key={q.id}
                                className={`overflow-hidden transition-all shadow-xs ${
                                    isMastered ? "border-emerald-500/30 bg-muted/20 opacity-80" : "border-border"
                                }`}
                            >
                                <CardHeader className="bg-muted/40 py-3 px-4 border-b">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="font-mono text-xs">
                                                Q{q.position}
                                            </Badge>
                                            <span className="text-xs font-semibold text-foreground">
                                                {q.series_name}
                                            </span>
                                            {q.submitted_at && (
                                                <span className="text-[11px] text-muted-foreground">
                                                    • {formatRelativeTime(q.submitted_at)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {q.status === "incorrect" ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px]"
                                                >
                                                    Incorrect ({q.marks_awarded < 0 ? `${q.marks_awarded}` : "0"} marks)
                                                </Badge>
                                            ) : q.status === "unanswered" ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]"
                                                >
                                                    Unanswered (0 marks)
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]"
                                                >
                                                    Correct (+{q.marks} marks)
                                                </Badge>
                                            )}

                                            <Button
                                                variant={isMastered ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => toggleMastered(q.id)}
                                                className={`h-7 px-2 text-[11px] gap-1 cursor-pointer ${
                                                    isMastered
                                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        : "text-muted-foreground hover:text-emerald-600"
                                                }`}
                                                title="Mark as understood / mastered"
                                            >
                                                <Check className="h-3 w-3" />
                                                {isMastered ? "Mastered" : "Mark Mastered"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 sm:p-5 space-y-4">
                                    {/* Question Text */}
                                    <div
                                        className="text-sm font-medium leading-relaxed text-foreground"
                                        dangerouslySetInnerHTML={{
                                            __html: sanitizeHtmlContent(q.question_text),
                                        }}
                                    />

                                    {/* Question Diagram */}
                                    {q.diagram_path && (
                                        <div className="my-2 rounded-lg border bg-muted/20 p-2 max-w-md">
                                            <img
                                                src={`/api/backend/${q.diagram_path.replace(/^\//, "")}`}
                                                alt="Question Diagram"
                                                className="max-h-60 rounded object-contain"
                                            />
                                        </div>
                                    )}

                                    {/* Options Grid */}
                                    <div className="grid gap-2 sm:grid-cols-2 pt-2">
                                        {q.options.map((opt) => {
                                            const isSelected =
                                                q.selected_option_id != null &&
                                                String(q.selected_option_id) === String(opt.id);
                                            const isCorrect =
                                                q.correct_option_id != null &&
                                                String(q.correct_option_id) === String(opt.id);

                                            let optBorder = "border-border";
                                            let optBg = "bg-card";

                                            if (isCorrect) {
                                                optBorder = "border-emerald-500";
                                                optBg = "bg-emerald-500/5 font-medium";
                                            } else if (isSelected) {
                                                optBorder = "border-destructive";
                                                optBg = "bg-destructive/5";
                                            }

                                            return (
                                                <div
                                                    key={opt.id}
                                                    className={`flex items-start gap-3 rounded-lg border p-3 text-xs sm:text-sm ${optBorder} ${optBg}`}
                                                >
                                                    <div className="pt-0.5 shrink-0">
                                                        {isCorrect ? (
                                                            <Check className="h-4 w-4 text-emerald-600 font-bold" />
                                                        ) : isSelected ? (
                                                            <XCircle className="h-4 w-4 text-destructive font-bold" />
                                                        ) : (
                                                            <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 space-y-1">
                                                        <div
                                                            dangerouslySetInnerHTML={{
                                                                __html: sanitizeHtmlContent(opt.ans),
                                                            }}
                                                        />
                                                        {opt.diagram_path && (
                                                            <img
                                                                src={`/api/backend/${opt.diagram_path.replace(/^\//, "")}`}
                                                                alt="Option Diagram"
                                                                className="max-h-28 rounded object-contain mt-1"
                                                            />
                                                        )}
                                                    </div>

                                                    {isCorrect && (
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-auto text-[10px] shrink-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                        >
                                                            {isSelected ? "Correct Option" : "Correct Answer"}
                                                        </Badge>
                                                    )}
                                                    {!isCorrect && isSelected && (
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-auto text-[10px] shrink-0 border-destructive/40 bg-destructive/10 text-destructive"
                                                        >
                                                            Your Answer
                                                        </Badge>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Action link to attempt */}
                                    <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                                        <span>
                                            Question #{q.position} • {q.marks} mark{q.marks !== 1 ? "s" : ""}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary cursor-pointer"
                                            nativeButton={false}
                                            render={<Link href={`/student/attempts/${q.attempt_id}`} />}
                                        >
                                            <span>Review in full test</span>
                                            <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
