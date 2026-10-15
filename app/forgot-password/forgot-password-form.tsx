"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordForm() {
    const router = useRouter();
    const [step, setStep] = useState<"request" | "reset">("request");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Resend countdown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const interval = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendCooldown]);

    async function handleRequestOtp(e?: FormEvent) {
        if (e) e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!email.trim() || !email.includes("@")) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/auth/forgot-password/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                const msg = data?.detail || data?.message || "Failed to send reset code. Please try again.";
                throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
            }

            toast.success("Verification code sent! Please check your email inbox.");
            setStep("reset");
            setResendCooldown(60);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Unable to send verification code.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleResetPassword(e: FormEvent) {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!otp.trim()) {
            setError("Please enter the 6-digit verification code.");
            return;
        }

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/auth/forgot-password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    otp: otp.trim(),
                    new_password: newPassword,
                    confirm_new_password: confirmPassword,
                }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                const msg = data?.detail || data?.message || "Failed to reset password. Please verify the OTP.";
                throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
            }

            const successMsg = data?.message || "Password reset successful! Redirecting to login...";
            setSuccessMessage(successMsg);
            toast.success(successMsg);

            setTimeout(() => {
                router.push("/login");
            }, 1800);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to reset password.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-5">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pb-1">
                <div className={`flex items-center gap-1.5 font-medium ${step === "request" ? "text-primary" : "text-muted-foreground"}`}>
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] ${step === "request" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</span>
                    Request Code
                </div>
                <div className="w-8 h-px bg-border" />
                <div className={`flex items-center gap-1.5 font-medium ${step === "reset" ? "text-primary" : "text-muted-foreground"}`}>
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] ${step === "reset" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
                    Set New Password
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {successMessage && (
                <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <AlertDescription className="text-emerald-300">{successMessage}</AlertDescription>
                </Alert>
            )}

            {step === "request" ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Registered Email Address</Label>
                        <div className="relative">
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="pl-10"
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            We will send a 6-digit verification code to this email.
                        </p>
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Sending verification code..." : "Send Reset Code"}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs flex items-center justify-between">
                        <div>
                            <span className="text-muted-foreground">Code sent to: </span>
                            <span className="font-semibold text-foreground">{email}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setStep("request");
                                setError("");
                            }}
                            className="text-primary hover:underline text-xs"
                        >
                            Change
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="otp">6-Digit Verification Code</Label>
                            <button
                                type="button"
                                disabled={resendCooldown > 0 || isSubmitting}
                                onClick={() => handleRequestOtp()}
                                className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                            >
                                <RefreshCw className={`h-3 w-3 ${isSubmitting ? "animate-spin" : ""}`} />
                                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                            </button>
                        </div>
                        <div className="relative">
                            <Input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                required
                                autoFocus
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="123456"
                                className="tracking-widest text-center text-lg font-mono font-bold"
                            />
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your new password"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <Button type="submit" disabled={isSubmitting || Boolean(successMessage)} className="w-full">
                        {isSubmitting ? "Resetting password..." : "Reset Password"}
                    </Button>
                </form>
            )}

            <div className="pt-2 text-center text-sm">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Sign In
                </Link>
            </div>
        </div>
    );
}
