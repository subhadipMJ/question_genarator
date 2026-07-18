"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function OrganizationForm() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setIsSubmitting(true);

        const form = event.currentTarget;
        const formData = new FormData(form);

        try {
            const response = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.get("organizationName"),
                    location: formData.get("location") || null,
                    phone_number: formData.get("phoneNumber") || null,
                    admin: {
                        name: formData.get("adminName"),
                        email: formData.get("adminEmail"),
                    },
                }),
            });
            const result = await response.json().catch(() => null) as { message?: string } | null;

            if (!response.ok) throw new Error(result?.message ?? "Unable to create organization.");

            form.reset();
            setSuccess("Organization and administrator created successfully.");
        } catch (submitError: unknown) {
            setError(submitError instanceof Error ? submitError.message : "Unable to create organization.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <fieldset className="space-y-5">
                <legend className="mb-4 text-lg font-semibold">Organization details</legend>
                <Field label="Organization name" htmlFor="organizationName">
                    <Input id="organizationName" name="organizationName" required autoFocus placeholder="Acme Academy" />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Location" htmlFor="location">
                        <Input id="location" name="location" placeholder="Colombo" />
                    </Field>
                    <Field label="Phone number" htmlFor="phoneNumber">
                        <Input id="phoneNumber" name="phoneNumber" type="tel" minLength={5} placeholder="+94 11 234 5678" />
                    </Field>
                </div>
            </fieldset>

            <Separator />
            <fieldset className="grid gap-5 sm:grid-cols-2">
                <legend className="mb-4 text-lg font-semibold">Administrator account</legend>
                <Field label="Full name" htmlFor="adminName">
                    <Input id="adminName" name="adminName" required autoComplete="name" placeholder="Alex Morgan" />
                </Field>
                <Field label="Email address" htmlFor="adminEmail">
                    <Input id="adminEmail" name="adminEmail" type="email" required autoComplete="email" placeholder="admin@example.com" />
                </Field>
            </fieldset>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && (
                <div className="space-y-4">
                    <Alert><AlertDescription>{success}</AlertDescription></Alert>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" nativeButton={false} render={<Link href="/super-admin" />}>
                            Return to Super Admin
                        </Button>
                    </div>
                </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating organization..." : "Create organization and admin"}
            </Button>
        </form>
    );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
        </div>
    );
}
