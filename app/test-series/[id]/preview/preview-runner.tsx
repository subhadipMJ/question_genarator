"use client";

import { useState, useEffect } from "react";
import { sanitizeHtmlContent } from "@/lib/sanitize";
import { Check, ArrowLeft, LayoutGrid, List as ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type PreviewOption = {
    id: number;
    text: string;
    is_correct: boolean;
    diagram_path?: string | null;
};

type PreviewQuestion = {
    question_id: number;
    question: string;
    marks: number;
    options: PreviewOption[];
    diagram_path?: string | null;
    diagrams?: { id: number; path: string }[];
};

type PreviewData = {
    series_id: number;
    series_name: string;
    questions: PreviewQuestion[];
};

export default function PreviewRunner({ initialData }: { initialData: PreviewData }) {
    const [viewMode, setViewMode] = useState<"single" | "list">("single");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Keyboard navigation for Single mode
    useEffect(() => {
        if (viewMode !== "single" || !initialData.questions.length) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
            } else if (e.key === "ArrowRight") {
                setCurrentQuestionIndex((prev) => Math.min(initialData.questions.length - 1, prev + 1));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [viewMode, initialData.questions.length]);

    if (!initialData || !initialData.questions || initialData.questions.length === 0) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <Card className="text-center p-12 bg-muted/20 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-xl">No Questions Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            This test series does not have any questions yet.
                        </p>
                        <div className="mt-6 flex justify-center">
                            <Button nativeButton={false} render={<Link href={`/test-series/${initialData?.series_id}`} />}>
                                Return to Editor
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const renderQuestionCard = (q: PreviewQuestion, idx: number) => (
        <Card key={q.question_id} className="scroll-mt-24 transition-opacity">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium leading-relaxed flex items-start justify-between gap-3">
                    <div>
                        <span className="mr-2 font-bold">{idx + 1}.</span>
                        <span
                            dangerouslySetInnerHTML={{
                                __html: sanitizeHtmlContent(q.question),
                            }}
                        />
                        {q.diagrams && q.diagrams.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-3">
                                {q.diagrams.map((d) => (
                                    <img
                                        key={d.id}
                                        src={`/api/backend/${d.path}`}
                                        alt="Question Diagram"
                                        className="max-h-80 max-w-full rounded border bg-background p-1.5 object-contain shadow-xs"
                                    />
                                ))}
                            </div>
                        ) : q.diagram_path ? (
                            <div className="mt-3">
                                <img
                                    src={`/api/backend/${q.diagram_path}`}
                                    alt="Question Diagram"
                                    className="max-h-80 max-w-full rounded border bg-background p-1.5 object-contain shadow-xs"
                                />
                            </div>
                        ) : null}
                        <span className="text-muted-foreground ml-2 text-sm font-normal">
                            ({q.marks} mark{q.marks !== 1 ? "s" : ""})
                        </span>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="grid gap-2.5 sm:grid-cols-2">
                    {q.options.map((opt) => {
                        const isCorrect = opt.is_correct;
                        let containerClasses = "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm cursor-default";
                        
                        if (isCorrect) {
                            containerClasses += " border-emerald-500 bg-emerald-500/5 font-medium dark:bg-emerald-950/20";
                        } else {
                            containerClasses += " border-border opacity-60";
                        }

                        return (
                            <div key={opt.id} className={containerClasses}>
                                {isCorrect ? (
                                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 font-bold" />
                                ) : (
                                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                                )}
                                
                                <div className="flex-1 space-y-1.5">
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: sanitizeHtmlContent(opt.text),
                                        }}
                                    />
                                    {opt.diagram_path && (
                                        <div>
                                            <img
                                                src={`/api/backend/${opt.diagram_path}`}
                                                alt="Option Diagram"
                                                className="max-h-40 max-w-full rounded border bg-background p-1 object-contain shadow-xs"
                                            />
                                        </div>
                                    )}
                                </div>
                                {isCorrect && (
                                    <Badge variant="outline" className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                        Correct Option
                                    </Badge>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{initialData.series_name}</h1>
                    <p className="text-sm text-muted-foreground mt-1">Previewing {initialData.questions.length} question(s)</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-lg border bg-muted/40 p-1">
                        <Button
                            type="button"
                            variant={viewMode === "single" ? "default" : "ghost"}
                            size="sm"
                            className="h-7 px-2.5 text-xs cursor-pointer"
                            onClick={() => setViewMode("single")}
                        >
                            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
                            Single Question
                        </Button>
                        <Button
                            type="button"
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="sm"
                            className="h-7 px-2.5 text-xs cursor-pointer"
                            onClick={() => setViewMode("list")}
                        >
                            <ListIcon className="mr-1.5 h-3.5 w-3.5" />
                            List View (All)
                        </Button>
                    </div>

                    <Button variant="outline" nativeButton={false} render={<Link href={`/test-series/${initialData.series_id}`} />}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Editor
                    </Button>
                </div>
            </div>

            {viewMode === "list" ? (
                <div className="max-w-4xl mx-auto space-y-5">
                    {initialData.questions.map((q, idx) => renderQuestionCard(q, idx))}
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
                    <div className="space-y-4">
                        {initialData.questions[currentQuestionIndex] && renderQuestionCard(initialData.questions[currentQuestionIndex], currentQuestionIndex)}
                        
                        {initialData.questions.length > 1 && (
                            <div className="flex items-center justify-between gap-4 py-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                                    disabled={currentQuestionIndex === 0}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm font-medium text-muted-foreground">
                                    Question {currentQuestionIndex + 1} of {initialData.questions.length}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentQuestionIndex((index) => Math.min(initialData.questions.length - 1, index + 1))}
                                    disabled={currentQuestionIndex === initialData.questions.length - 1}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    <aside className="lg:sticky lg:top-8">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Questions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
                                    {initialData.questions.map((q, index) => {
                                        const isCurrent = index === currentQuestionIndex;
                                        let bubbleClasses = "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors cursor-pointer ";
                                        bubbleClasses += "border-border bg-muted text-muted-foreground hover:bg-muted/70 ";
                                        if (isCurrent) {
                                            bubbleClasses += "ring-2 ring-primary ring-offset-2 ring-offset-background ";
                                        }
                                        return (
                                            <button
                                                key={q.question_id}
                                                type="button"
                                                onClick={() => setCurrentQuestionIndex(index)}
                                                className={bubbleClasses}
                                                aria-label={`Jump to question ${index + 1}`}
                                            >
                                                {index + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            )}
        </div>
    );
}
