"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { TestSeries } from "../services/test-series";
import type { Question } from "../services/questions";
import type { Topic } from "../services/topics";
import TestSeriesModal, { TestSeriesModalFormData } from "./test-series-modal";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getApiError(data: unknown, status: number): string {
    if (data && typeof data === "object") {
        const v = data as { detail?: unknown; message?: unknown };
        if (typeof v.detail === "string") return v.detail;
        if (Array.isArray(v.detail)) {
            const msgs = v.detail.flatMap((i) =>
                i && typeof i === "object" && "msg" in i ? [String(i.msg)] : [],
            );
            if (msgs.length > 0) return msgs.join(", ");
        }
        if (typeof v.message === "string") return v.message;
    }
    return `Server returned error status ${status}`;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
        const remainingMins = mins % 60;
        return `${hrs}h${remainingMins > 0 ? ` ${remainingMins}m` : ""}`;
    }
    return `${mins}m`;
}

function formatExpiry(isoString: string): string {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Unknown validity";
    if (d < new Date()) return "Expired";
    return `Valid until ${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
}

function StatPill({ label, value }: { label: string; value: number }) {
    return (
        <div className="border bg-card text-card-foreground flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs shadow-sm">
            <span className="text-muted-foreground font-medium">{label}:</span>
            <span className="font-bold">{value}</span>
        </div>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function TestSeriesManager({
    initialSeries,
    organizations = {},
    userId,
    userRole,
    userOrgId,
}: {
    initialSeries: TestSeries[];
    organizations?: Record<number, string>;
    questions?: Question[];
    topics?: Topic[];
    userId: number;
    userRole?: string;
    userOrgId?: number;
}) {
    const [series, setSeries] = useState(initialSeries);
    const [busy, setBusy] = useState(false);
    const [newInviteToken, setNewInviteToken] = useState<string | null>(null);
    const [origin, setOrigin] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    function closeModal() {
        setIsCreateOpen(false);
    }

    // get origin only on client
    useMemo(() => {
        if (typeof window !== "undefined") setOrigin(window.location.origin);
    }, []);

    async function handleModalSubmit(data: TestSeriesModalFormData) {
        setBusy(true);
        try {
            const res = await fetch("/api/backend/test-series/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    access_type: data.access_type,
                    valid_until: data.valid_until,
                    duration_seconds: data.duration_seconds,
                    question_ids: [],
                    is_active: true,
                }),
            });
            const responseData = await res.json().catch(() => null);
            if (!res.ok) throw new Error(getApiError(responseData, res.status));

            setSeries((prev) => [responseData as TestSeries, ...prev]);
            setNewInviteToken((responseData as TestSeries).invite_token ?? null);
            toast.success("Test series created!");
            closeModal();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Unable to create test series.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            {/* ── Page Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Test Series</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Create timed assessments and share them with students.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create Test Series
                    </Button>
                    <StatPill label="Total Series" value={series.length} />
                    <StatPill label="Active" value={series.filter((s) => new Date(s.valid_until) >= new Date()).length} />
                </div>
            </div>

            {/* ── Invite Link Banner ── */}
            {newInviteToken && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-4 animate-in fade-in duration-200">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">Invite link (copy it now — won&apos;t be shown again)</p>
                        <code className="mt-1 block break-all text-xs text-muted-foreground">
                            {`${origin}/student/join#token=${newInviteToken}`}
                        </code>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            navigator.clipboard.writeText(`${origin}/student/join#token=${newInviteToken}`);
                            toast.success("Copied!");
                        }}
                    >
                        Copy link
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setNewInviteToken(null)}
                    >
                        Dismiss
                    </Button>
                </div>
            )}

            {/* ── Create Modal ── */}
            <TestSeriesModal
                isOpen={isCreateOpen}
                onClose={closeModal}
                editingSeries={null}
                onSubmit={handleModalSubmit}
                busy={busy}
            />

            {/* ── Series List ── */}
            <section aria-label="Existing test series">
                <h2 className="mb-4 text-lg font-semibold">All test series</h2>
                {series.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-10 text-center">
                        <p className="text-muted-foreground text-sm">No test series yet. Click "Create Test Series" above.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {series.map((s) => {
                            const canEdit =
                                (userRole === "0" && s.org_id === 0) ||
                                (userRole === "1" && s.org_id === userOrgId) ||
                                s.created_by === userId;
                            return (
                                <SeriesCard
                                    key={s.id}
                                    s={s}
                                    origin={origin}
                                    canEdit={canEdit}
                                    organizations={organizations}
                                />
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

function SeriesCard({
    s,
    origin,
    canEdit,
    organizations,
}: {
    s: TestSeries;
    origin: string;
    canEdit: boolean;
    organizations: Record<number, string>;
}) {
    const expired = new Date(s.valid_until) < new Date();
    const orgName = s.org_id === 0 ? "QMaster" : organizations[s.org_id] ?? `Organization #${s.org_id}`;
    return (
        <div className="border bg-card text-card-foreground rounded-lg shadow-sm group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            {/* accent stripe */}
            <div className={`absolute inset-y-0 left-0 w-1 rounded-l-xl ${expired ? "bg-muted-foreground/30" : "bg-primary"}`} />

            <div className="pl-5 pr-4 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate text-base leading-tight mb-1">{s.name}</p>
                    <p className="text-muted-foreground text-xs">
                        {s.question_ids.length === 0 ? (
                            <span className="text-amber-600 dark:text-amber-500 font-medium">Empty series — click edit to configure</span>
                        ) : (
                            `${s.question_ids.length} question${s.question_ids.length !== 1 ? "s" : ""}`
                        )}
                        {" · "}
                        {formatDuration(s.duration_seconds)} · {formatExpiry(s.valid_until)}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                        {s.invite_token && (
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${origin}/student/join#token=${s.invite_token}`);
                                    toast.success("Invite link copied!");
                                }}
                                className="text-muted-foreground hover:text-foreground text-xs font-medium underline underline-offset-2 flex items-center gap-1"
                            >
                                Copy invite link
                            </button>
                        )}
                        <span className="text-muted-foreground text-xs">
                            Access: <span className="font-medium text-foreground capitalize">{s.access_type.replace("_", " ")}</span>
                        </span>
                        <span className="text-muted-foreground text-xs">
                            · Organization: <span className="font-medium text-foreground">{orgName}</span>
                        </span>
                    </div>
                </div>

                {canEdit && (
                    <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/test-series/${s.id}`} />}
                        className="shrink-0 h-8 text-xs font-semibold px-3"
                    >
                        Edit
                    </Button>
                )}
            </div>
        </div>
    );
}
