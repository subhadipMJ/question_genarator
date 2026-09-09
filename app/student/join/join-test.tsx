"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, HelpCircle, Calendar, AlertCircle, LogIn, UserPlus, ArrowRight, ShieldAlert, Sparkles, CheckCircle } from "lucide-react";

type InviteTestInfo = {
    id: number;
    name: string;
    duration_seconds: number;
    question_count: number;
    valid_until: string;
    is_active: boolean;
    is_expired: boolean;
    access_type: string;
};

export default function JoinTest() {
    const [token, setToken] = useState<string>("");
    const [inputToken, setInputToken] = useState<string>("");
    const [mounted, setMounted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [testInfo, setTestInfo] = useState<InviteTestInfo | null>(null);
    const [infoError, setInfoError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const router = useRouter();

    const extractToken = useCallback(() => {
        if (typeof window === "undefined") return "";
        // 1. Hash fragment: #token=...
        const hash = window.location.hash;
        if (hash) {
            const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
            const t = hashParams.get("token");
            if (t) return t.trim();
        }

        // 2. Query search: ?token=... or ?invite_token=...
        const searchParams = new URLSearchParams(window.location.search);
        const searchToken = searchParams.get("token") || searchParams.get("invite_token");
        if (searchToken) return searchToken.trim();

        return "";
    }, []);

    // Check authentication and load initial token
    useEffect(() => {
        setMounted(true);

        const checkAuth = () => {
            const cookies = document.cookie;
            const hasAuth = cookies.includes("access_token=") && !cookies.includes("access_token=;");
            setIsAuthenticated(hasAuth);
        };
        checkAuth();

        const detected = extractToken();
        if (detected) {
            setToken(detected);
            setInputToken(detected);
        }

        const handleHashChange = () => {
            const nextTok = extractToken();
            if (nextTok) {
                setToken(nextTok);
                setInputToken(nextTok);
            }
        };

        window.addEventListener("hashchange", handleHashChange);
        window.addEventListener("popstate", handleHashChange);
        return () => {
            window.removeEventListener("hashchange", handleHashChange);
            window.removeEventListener("popstate", handleHashChange);
        };
    }, [extractToken]);

    // Fetch test preview info whenever token changes
    useEffect(() => {
        if (!token) {
            setTestInfo(null);
            setInfoError(null);
            return;
        }

        let isCancelled = false;
        async function fetchInfo() {
            setLoadingInfo(true);
            setInfoError(null);
            try {
                const res = await fetch(`/api/backend/student/test-series/invite-info?token=${encodeURIComponent(token)}`);
                const data = await res.json().catch(() => null);

                if (isCancelled) return;

                if (!res.ok || !data) {
                    const errorMsg = Array.isArray(data?.detail)
                        ? data.detail.map((e: { msg?: string }) => e.msg).join(", ")
                        : (data?.detail || data?.message || "Invalid or unrecognised invite link.");
                    setInfoError(errorMsg);
                    setTestInfo(null);
                } else {
                    setTestInfo(data as InviteTestInfo);
                    setInfoError(null);
                }
            } catch {
                if (!isCancelled) {
                    setInfoError("Unable to load test details. You can still try to start directly.");
                }
            } finally {
                if (!isCancelled) {
                    setLoadingInfo(false);
                }
            }
        }

        fetchInfo();
        return () => {
            isCancelled = true;
        };
    }, [token]);

    function handleManualSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = inputToken.trim();
        if (!trimmed) {
            toast.error("Please enter a valid invite token or link.");
            return;
        }

        // If user pasted a full URL, extract token parameter or hash
        let tokenToSet = trimmed;
        if (trimmed.includes("token=")) {
            try {
                const url = new URL(trimmed.startsWith("http") ? trimmed : `http://localhost/${trimmed}`);
                const hashParam = new URLSearchParams(url.hash.replace(/^#/, "")).get("token");
                const searchParam = url.searchParams.get("token");
                tokenToSet = hashParam || searchParam || trimmed;
            } catch {
                // Not a valid URL, use raw string
            }
        }

        setToken(tokenToSet);
        window.location.hash = `token=${tokenToSet}`;
    }

    async function start() {
        if (!token) {
            toast.error("Missing invite token.");
            return;
        }

        setBusy(true);
        try {
            const r = await fetch("/api/backend/student/test-series/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invite_token: token }),
            });
            const d = await r.json().catch(() => null);

            if (!r.ok || !d) {
                if (r.status === 401) {
                    toast.error("Please log in as a student to take this test.");
                    router.push(`/login#token=${encodeURIComponent(token)}`);
                    return;
                }

                const errorMsg = Array.isArray(d?.detail)
                    ? d.detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(", ")
                    : (d?.detail || d?.message || "Unable to join test.");

                throw new Error(errorMsg);
            }

            // Remove token from hash and route to attempt runner
            history.replaceState(null, "", window.location.pathname);
            toast.success("Test session started! Good luck.");
            router.push(`/student/attempts/${d.id}?started=1`);
        } catch (x) {
            toast.error(x instanceof Error ? x.message : "Unable to join test.");
        } finally {
            setBusy(false);
        }
    }

    if (!mounted) {
        return (
            <Card className="max-w-lg mx-auto shadow-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Join Invited Test</CardTitle>
                    <CardDescription>Loading exam session details...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            <Card className="shadow-lg border-border/80 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {testInfo ? testInfo.name : "Join Invited Test"}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                        {testInfo
                            ? "You've been invited to participate in this test series."
                            : "Enter with your exclusive student invitation link or code."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    {/* Test Series Info Card if loaded */}
                    {loadingInfo && (
                        <div className="flex items-center justify-center gap-3 p-6 bg-muted/30 rounded-xl border border-border/50 text-sm text-muted-foreground animate-pulse">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <span>Validating invitation link...</span>
                        </div>
                    )}

                    {testInfo && !loadingInfo && (
                        <div className="bg-muted/40 rounded-xl p-4 border space-y-3">
                            <div className="flex items-center justify-between border-b pb-2.5">
                                <span className="text-xs font-medium text-muted-foreground">Access Type</span>
                                <Badge variant="secondary" className="capitalize text-[11px] font-semibold">
                                    {testInfo.access_type.replace("_", " ")}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-xs">
                                        Duration: <strong className="text-foreground">{Math.round(testInfo.duration_seconds / 60)} mins</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-xs">
                                        Questions: <strong className="text-foreground">{testInfo.question_count}</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-xs">
                                        Valid Until: <strong className="text-foreground">{new Date(testInfo.valid_until).toLocaleString()}</strong>
                                    </span>
                                </div>
                            </div>

                            {testInfo.is_expired && (
                                <div className="flex items-center gap-2 p-2.5 bg-destructive/10 text-destructive rounded-lg text-xs font-medium">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>This test series has expired. Submissions are no longer accepted.</span>
                                </div>
                            )}

                            {!testInfo.is_active && (
                                <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>This test is currently inactive. Please contact your instructor.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {infoError && !loadingInfo && (
                        <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 text-destructive rounded-xl text-xs">
                            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                                <strong className="font-semibold block">Invalid or Expired Link</strong>
                                <span>{infoError}</span>
                            </div>
                        </div>
                    )}

                    {/* Manual token input fallback if no token or token is invalid */}
                    {(!token || infoError) && (
                        <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Have an invite token or link? Paste it here:
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g. K8mP2xV7qN4sR9cT..."
                                        value={inputToken}
                                        onChange={(e) => setInputToken(e.target.value)}
                                        className="text-xs font-mono"
                                    />
                                    <Button type="submit" size="sm" variant="secondary" className="shrink-0">
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Unauthenticated notice and CTA */}
                    {isAuthenticated === false && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                            <div className="flex items-start gap-2.5">
                                <LogIn className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div className="text-xs space-y-1">
                                    <p className="font-semibold text-foreground">Sign In Required</p>
                                    <p className="text-muted-foreground">
                                        You must be logged into your student account to record test attempts and scores.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button
                                    className="flex-1 text-xs h-8 gap-1.5 font-semibold"
                                    render={<Link href={`/login#token=${encodeURIComponent(token || inputToken)}`} />}
                                >
                                    <LogIn className="w-3.5 h-3.5" />
                                    Log In as Student
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 text-xs h-8 gap-1.5 font-semibold"
                                    render={<Link href={`/register#token=${encodeURIComponent(token || inputToken)}`} />}
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    Register
                                </Button>
                            </div>
                        </div>
                    )}

                    {testInfo && !testInfo.is_expired && testInfo.is_active && (
                        <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Confirm your readiness before starting. The exam timer begins immediately.</span>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="pt-2 pb-6 flex flex-col gap-3">
                    <Button
                        className="w-full h-11 text-sm font-semibold gap-2 shadow-sm"
                        disabled={!token || busy || (testInfo?.is_expired ?? false) || (testInfo ? !testInfo.is_active : false)}
                        onClick={start}
                    >
                        {busy ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                <span>Starting Examination...</span>
                            </>
                        ) : (
                            <>
                                <span>Start Test</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        render={<Link href="/student/tests" />}
                    >
                        Browse all available public tests
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
