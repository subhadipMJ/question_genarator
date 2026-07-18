"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "../../services/users";

export default function SendMailForm({ users = [] }: { users?: User[] }) {
    const [toEmail, setToEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!toEmail.trim() || !body.trim()) {
            setError("Recipient email and message body are required.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/backend/mail/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to_email: toEmail.trim(),
                    subject: subject.trim() || "Notification from QMaster",
                    body: body.trim(),
                }),
            });

            const result = await response.json().catch(() => null) as { detail?: string; message?: string } | null;

            if (!response.ok) {
                throw new Error(result?.detail ?? result?.message ?? `Failed to send email (${response.status})`);
            }

            setSuccess(result?.message ?? `Email successfully sent to ${toEmail.trim()}.`);
            toast.success("Email sent successfully!");
            setToEmail("");
            setSubject("");
            setBody("");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unable to send email.";
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="toEmail">Recipient Email</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                        id="toEmail"
                        type="email"
                        required
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="flex-1"
                    />
                    {users.length > 0 && (
                        <select
                            aria-label="Select registered user"
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                if (e.target.value) setToEmail(e.target.value);
                            }}
                            defaultValue=""
                            className="flex h-10 w-full sm:w-56 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="" disabled>
                                Select registered user...
                            </option>
                            {users.map((u) => (
                                <option key={u.id} value={u.email}>
                                    {u.name} ({u.email})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Important Announcement"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="body">Message Body</Label>
                <textarea
                    id="body"
                    required
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type your message content here... (Plain text or HTML supported)"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" nativeButton={false} render={<Link href="/super-admin" />}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send email"}
                </Button>
            </div>
        </form>
    );
}
