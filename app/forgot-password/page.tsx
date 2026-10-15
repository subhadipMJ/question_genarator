import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ForgotPasswordForm from "./forgot-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
    title: "Reset Password with OTP | Safalya",
    description: "Recover your Safalya account using a secure email verification code.",
};

export default async function ForgotPasswordPage() {
    if ((await cookies()).has("access_token")) {
        redirect("/dashboard");
    }

    return (
        <main
            className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-black bg-cover bg-center px-4 py-12"
            style={{ backgroundImage: "url('https://cdn.pixabay.com/photo/2024/12/28/01/27/ai-generated-9295105_1280.jpg')" }}
        >
            <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden="true" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent,rgb(0_0_0_/_0.45))]" aria-hidden="true" />
            <Card className="w-full max-w-md border-white/20 bg-card/90 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <CardHeader>
                    <CardDescription>Safalya · Account Recovery</CardDescription>
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>Verify your identity with an OTP code sent to your email.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ForgotPasswordForm />
                </CardContent>
            </Card>
        </main>
    );
}
