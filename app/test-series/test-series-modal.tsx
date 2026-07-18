"use client";

import { FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { TestSeries } from "../services/test-series";

function formatDateTimeLocal(isoString?: string): string {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export type TestSeriesModalFormData = {
    name: string;
    access_type: "public" | "invite_only";
    valid_until: string;
    duration_seconds: number;
};

type TestSeriesModalProps = {
    isOpen: boolean;
    onClose: () => void;
    editingSeries: TestSeries | null;
    onSubmit: (data: TestSeriesModalFormData) => void;
    busy: boolean;
};

export default function TestSeriesModal({
    isOpen,
    onClose,
    editingSeries,
    onSubmit,
    busy,
}: TestSeriesModalProps) {
    if (!isOpen) return null;

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const validUntil = new Date(String(f.get("valid_until")));
        if (Number.isNaN(validUntil.getTime()) || validUntil.getTime() <= Date.now()) {
            toast.error("Valid until must be a future date and time.");
            return;
        }
        const durationMinutes = Number(f.get("duration_minutes"));
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
            toast.error("Duration must be greater than zero.");
            return;
        }

        onSubmit({
            name: String(f.get("name") ?? "").trim(),
            access_type: f.get("access_type") as "public" | "invite_only",
            valid_until: validUntil.toISOString(),
            duration_seconds: Math.round(durationMinutes * 60),
        });
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative bg-background border rounded-xl shadow-lg w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
                    <div>
                        <h3 className="text-lg font-semibold leading-none tracking-tight">
                            {editingSeries ? "Edit Test Series" : "Create Test Series"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1.5">
                            {editingSeries
                                ? `Modify the details for "${editingSeries.name}"`
                                : "Configure the settings for the new test series."}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full shrink-0"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Modal Body & Form */}
                <form
                    key={editingSeries ? `edit-${editingSeries.id}` : "create"}
                    onSubmit={handleSubmit}
                    className="flex flex-col flex-1 overflow-hidden"
                >
                    <div className="p-6 overflow-y-auto space-y-6 flex-1">
                        {/* Row 1: name + access type */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="ts-name">Series name</Label>
                                <Input
                                    id="ts-name"
                                    name="name"
                                    placeholder="e.g. Physics Mock Test 1"
                                    required
                                    autoComplete="off"
                                    defaultValue={editingSeries?.name ?? ""}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ts-access">Access type</Label>
                                <select
                                    id="ts-access"
                                    name="access_type"
                                    className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    defaultValue={editingSeries?.access_type ?? "invite_only"}
                                >
                                    <option value="public">Public — anyone can start</option>
                                    <option value="invite_only">Invite only — share a link</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: valid until + duration */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="ts-valid-until">Valid until</Label>
                                <Input
                                    id="ts-valid-until"
                                    name="valid_until"
                                    type="datetime-local"
                                    required
                                    defaultValue={formatDateTimeLocal(editingSeries?.valid_until)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ts-duration">Duration (minutes)</Label>
                                <Input
                                    id="ts-duration"
                                    name="duration_minutes"
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 60"
                                    required
                                    defaultValue={
                                        editingSeries
                                            ? Math.round(editingSeries.duration_seconds / 60)
                                            : ""
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={busy}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={busy}
                        >
                            {busy
                                ? editingSeries
                                    ? "Saving…"
                                    : "Creating…"
                                : editingSeries
                                ? "Save changes"
                                : "Create test series"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
