"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    const [q, setQ] = useState("");

    const history = q.trim()
        ? allHistory.filter((a) =>
              a.series_name.toLowerCase().includes(q.trim().toLowerCase())
          )
        : allHistory;

     return (
        <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-muted-foreground text-sm">
                    Review your completed assessments, scores, and answer keys.
                </p>
                <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by test title or topic..."
                    className="w-64 max-w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {history.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center bg-card">
                    <p className="text-muted-foreground text-sm">
                        {q ? `No attempts match "${q}".` : "You have not attempted any tests yet."}
                    </p>
                    {!q && (
                        <Button variant="outline" className="mt-4" nativeButton={false} render={<Link href="/student/tests" />}>
                            View available tests
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {history.map((a) => {
                        const isSubmitted = a.status === "submitted" || a.status === 2;
                        const isForceSubmitted = a.status === "force_submitted" || a.status === 3;
                        const isInProgress = a.status === "in_progress" || a.status === 0;
                        const isExpired = a.status === "expired" || a.status === 1;

                        return (
                            <Link key={a.id} href={`/student/attempts/${a.id}`} className="group block">
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
                                            {isInProgress && (
                                                <Badge variant="secondary" className="w-32 justify-center shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                    In progress
                                                </Badge>
                                            )}
                                            {isForceSubmitted && (
                                                <Badge variant="outline" className="w-32 justify-center shrink-0 border-destructive/40 bg-destructive text-white dark:bg-destructive/20 font-medium">
                                                    Force Submitted
                                                </Badge>
                                            )}
                                            {isSubmitted && (
                                                <Badge variant="secondary" className="w-32 justify-center shrink-0 bg-green-500 text-white dark:bg-green-900/30 dark:text-green-400">
                                                    Completed
                                                </Badge>
                                            )}
                                            {isExpired && (
                                                <Badge variant="outline" className="w-32 justify-center shrink-0 text-muted-foreground">
                                                    Expired
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-[14px] text-orange">
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
                                            <span className="text-sm font-bold text-foreground">
                                                {a.score} <span className="text-muted-foreground text-sm font-normal">/ {a.total_marks}</span>
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link> 
                        );
                    })}
                </div>
            )}
        </>
    );
}