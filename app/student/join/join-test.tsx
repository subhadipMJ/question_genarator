"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    KeyRound,
    ArrowRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Clock,
    FileText,
    Award,
    ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type InviteInfo = {
    id: number;
    name: string;
    duration_seconds: number;
    question_count: number;
    total_marks?: number;
    has_negative_marks?: boolean;
    is_expired?: boolean;
};

function formatDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return "60 mins";
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} hr${h > 1 ? "s" : ""}`;
    return `${m} mins`;
}

export default function JoinTest() {
    const [token, setToken] = useState<string>("");
    const [mounted, setMounted] = useState(false);
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [testInfo, setTestInfo] = useState<InviteInfo | null>(null);
    const [starting, setStarting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        // Extract token from URL hash or query param if available
        let initialToken = "";
        if (typeof window !== "undefined") {
            const hash = window.location.hash;
            initialToken =
                new URLSearchParams(hash.slice(1)).get("token") ||
                new URLSearchParams(window.location.search).get("token") ||
                new URLSearchParams(window.location.search).get("code") ||
                "";
        }
        if (initialToken) {
            setToken(initialToken);
            void fetchTestInfo(initialToken);
        }
    }, []);

    async function fetchTestInfo(codeToLookup: string) {
        const trimmed = codeToLookup.trim();
        if (!trimmed) {
            setTestInfo(null);
            setErrorMsg(null);
            return;
        }

        setLoadingInfo(true);
        setErrorMsg(null);
        try {
            const res = await fetch(
                `/api/backend/student/test-series/invite-info?token=${encodeURIComponent(trimmed)}`
            );
            const data = await res.json().catch(() => null);
            if (!res.ok || !data) {
                throw new Error(data?.detail || "Invalid invite code or test not found.");
            }
            setTestInfo(data as InviteInfo);
        } catch (err) {
            setTestInfo(null);
            setErrorMsg(err instanceof Error ? err.message : "Invalid invite code or test not found.");
        } finally {
            setLoadingInfo(false);
        }
    }

    async function handleStart() {
        const cleanToken = token.trim();
        if (!cleanToken) {
            toast.error("Please enter a valid invite code or test token.");
            return;
        }

        setStarting(true);
        try {
            // Request fullscreen if supported
            if (!document.fullscreenElement) {
                document.documentElement.classList.add("exam-fullscreen");
                await document.documentElement.requestFullscreen().catch(() => undefined);
            }

            const res = await fetch("/api/backend/student/test-series/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invite_token: cleanToken }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok || !data) {
                throw new Error(data?.detail ?? "Unable to join test.");
            }

            toast.success("Joined test successfully!");
            if (typeof window !== "undefined") {
                history.replaceState(null, "", window.location.pathname);
            }
            router.push(`/student/attempts/${data.id}?started=1`);
        } catch (err) {
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(() => undefined);
            }
            document.documentElement.classList.remove("exam-fullscreen");
            toast.error(err instanceof Error ? err.message : "Unable to join test.");
        } finally {
            setStarting(false);
        }
    }

    if (!mounted) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <Card className="border-primary/20 shadow-md">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                        <KeyRound className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Join Assessment by Code
                    </CardTitle>
                    <CardDescription className="text-sm">
                        Enter the test invite token or assessment code provided by your instructor.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    {/* Input Field & Check Button */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Assessment Code / Invite Token
                        </label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g. AB12CD or test invite token"
                                value={token}
                                onChange={(e) => {
                                    setToken(e.target.value);
                                    if (testInfo) setTestInfo(null);
                                    if (errorMsg) setErrorMsg(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        void fetchTestInfo(token);
                                    }
                                }}
                                className="h-11 font-mono uppercase tracking-wider text-sm"
                                disabled={starting}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 px-4 cursor-pointer shrink-0 font-medium"
                                onClick={() => void fetchTestInfo(token)}
                                disabled={!token.trim() || loadingInfo || starting}
                            >
                                {loadingInfo ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Verify"
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Error display */}
                    {errorMsg && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Verified Test Information Preview */}
                    {testInfo && (
                        <div className="rounded-xl border bg-muted/40 p-4 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium gap-1 mb-1.5">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Verified Assessment
                                    </Badge>
                                    <h3 className="text-base font-bold text-foreground">
                                        {testInfo.name}
                                    </h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-lg border bg-background p-2.5">
                                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                        <FileText className="h-3 w-3" /> Questions
                                    </p>
                                    <p className="text-sm font-bold mt-0.5">{testInfo.question_count}</p>
                                </div>
                                <div className="rounded-lg border bg-background p-2.5">
                                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                        <Clock className="h-3 w-3" /> Duration
                                    </p>
                                    <p className="text-sm font-bold mt-0.5">{formatDuration(testInfo.duration_seconds)}</p>
                                </div>
                                <div className="rounded-lg border bg-background p-2.5">
                                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                        <Award className="h-3 w-3" /> Marks
                                    </p>
                                    <p className="text-sm font-bold mt-0.5">{testInfo.total_marks ?? testInfo.question_count}</p>
                                </div>
                            </div>

                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1">
                                <p className="font-semibold text-foreground flex items-center gap-1.5">
                                    <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                                    Exam Security Notice
                                </p>
                                <p>
                                    Starting this test will request fullscreen mode. Exiting fullscreen or switching windows will automatically submit your attempt.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Start Action Button */}
                    <Button
                        size="lg"
                        className="w-full h-11 text-sm font-semibold gap-2 shadow-sm cursor-pointer"
                        disabled={!token.trim() || starting || loadingInfo}
                        onClick={handleStart}
                    >
                        {starting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Entering Exam Workspace…
                            </>
                        ) : (
                            <>
                                {testInfo ? "Start Test in Fullscreen" : "Join Assessment"}
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
