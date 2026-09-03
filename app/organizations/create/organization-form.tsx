"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function OrganizationForm({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
    const router = useRouter();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

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
                        password: password,
                    },
                }),
            });
            const result = await response.json().catch(() => null) as {
                message?: string;
                detail?: string | Array<{ msg: string; loc?: (string | number)[] }>;
            } | null;

            if (!response.ok) {
                let errorMessage = "Unable to create organization.";
                if (typeof result?.detail === "string") {
                    errorMessage = result.detail;
                } else if (Array.isArray(result?.detail) && result.detail.length > 0) {
                    errorMessage = result.detail.map((err) => err.msg).join(", ");
                } else if (typeof result?.message === "string") {
                    errorMessage = result.message;
                }
                throw new Error(errorMessage);
            }

            form.reset();
            setPassword("");
            setConfirmPassword("");
            if (isSuperAdmin) {
                setSuccess("Organization and administrator created successfully.");
            } else {
                setSuccess("Organization registered successfully! Your account is currently inactive pending Super Admin approval.");
            }
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
                <legend className="mb-4 text-lg font-semibold sm:col-span-2">Administrator account</legend>
                <Field label="Full name" htmlFor="adminName">
                    <Input id="adminName" name="adminName" required autoComplete="name" placeholder="Alex Morgan" />
                </Field>
                <Field label="Email address" htmlFor="adminEmail">
                    <Input id="adminEmail" name="adminEmail" type="email" required autoComplete="email" placeholder="admin@example.com" />
                </Field>
                <Field label="Password" htmlFor="adminPassword">
                    <div className="relative">
                        <Input
                            id="adminPassword"
                            name="adminPassword"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </Field>
                <Field label="Confirm password" htmlFor="confirmPassword">
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                        <p className="mt-1 text-sm font-medium text-destructive">Passwords do not match</p>
                    )}
                </Field>
            </fieldset>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && (
                <div className="space-y-4">
                    <Alert><AlertDescription>{success}</AlertDescription></Alert>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" nativeButton={false} render={<Link href={isSuperAdmin ? "/super-admin" : "/login"} />}>
                            {isSuperAdmin ? "Return to Super Admin" : "Return to Sign In"}
                        </Button>
                    </div>
                </div>
            )}

            <Button type="submit" disabled={isSubmitting || (confirmPassword !== "" && password !== confirmPassword)} className="w-full">
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
