"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterForm() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setBusy(true);

        const f = new FormData(e.currentTarget);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: f.get("name"),
                    email: f.get("email"),
                    password: f.get("password"),
                }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                const msg =
                    typeof data?.detail === "string"
                        ? data.detail
                        : Array.isArray(data?.detail)
                            ? data.detail.map((d: { msg: string }) => d.msg).join(" ")
                            : data?.message ?? "Registration failed. Please try again.";
                throw new Error(msg);
            }

            // success — go straight to login
            router.push("/login?registered=1");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="reg-name">Full name</Label>
                <Input
                    id="reg-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    autoFocus
                    placeholder="Your full name"
                    minLength={1}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="reg-email">Email address</Label>
                <Input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                    <Input
                        id="reg-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        placeholder="At least 8 characters"
                        className="pr-10"
                    />
                    <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Creating account…" : "Create account"}
            </Button>
        </form>
    );
}
