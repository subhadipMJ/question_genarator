"use client";

import { FormEvent, useState } from "react";

export default function OrganizationForm() {
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
                    admin: {
                        name: formData.get("adminName"),
                        email: formData.get("adminEmail"),
                        password: formData.get("adminPassword"),
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

    const inputClass = "w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 outline-none transition focus:border-indigo-600 dark:border-gray-700 dark:focus:border-indigo-400";

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <fieldset className="space-y-5">
                <legend className="mb-4 text-lg font-semibold">Organization details</legend>
                <Field label="Organization name" htmlFor="organizationName">
                    <input id="organizationName" name="organizationName" required autoFocus className={inputClass} placeholder="Acme Academy" />
                </Field>
            </fieldset>

            <fieldset className="grid gap-5 border-t pt-8 dark:border-gray-800 sm:grid-cols-2">
                <legend className="mb-4 text-lg font-semibold">Administrator account</legend>
                <Field label="Full name" htmlFor="adminName">
                    <input id="adminName" name="adminName" required autoComplete="name" className={inputClass} placeholder="Alex Morgan" />
                </Field>
                <Field label="Email address" htmlFor="adminEmail">
                    <input id="adminEmail" name="adminEmail" type="email" required autoComplete="email" className={inputClass} placeholder="admin@example.com" />
                </Field>
                <div className="sm:col-span-2">
                    <Field label="Temporary password" htmlFor="adminPassword">
                        <input id="adminPassword" name="adminPassword" type="password" required minLength={8} autoComplete="new-password" className={inputClass} placeholder="At least 8 characters" />
                    </Field>
                </div>
            </fieldset>

            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
            {success && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">{success}</p>}

            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Creating organization..." : "Create organization and admin"}
            </button>
        </form>
    );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
    return (
        <div>
            <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium">{label}</label>
            {children}
        </div>
    );
}
