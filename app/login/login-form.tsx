"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginForm() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.get("email"),
                    password: formData.get("password"),
                }),
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            router.replace("/dashboard");
            router.refresh();
        } catch (loginError: unknown) {
            setError(loginError instanceof Error ? loginError.message : "Unable to log in.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                    Email address
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 outline-none transition focus:border-black dark:border-gray-700 dark:focus:border-white"
                    placeholder="you@example.com"
                />
            </div>

            <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 outline-none transition focus:border-black dark:border-gray-700 dark:focus:border-white"
                    placeholder="Enter your password"
                />
            </div>

            {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
                {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
}
