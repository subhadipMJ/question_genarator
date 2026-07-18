import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
    title: "Sign in | QMaster",
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ registered?: string }>;
}) {
    if ((await cookies()).has("access_token")) {
        redirect("/questions");
    }

    const { registered } = await searchParams;

    return (
        <main
            className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-black bg-cover bg-center px-4 py-12"
            style={{ backgroundImage: "url('https://cdn.pixabay.com/photo/2024/12/28/01/27/ai-generated-9295105_1280.jpg')" }}
        >
            <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden="true" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent,rgb(0_0_0_/_0.45))]" aria-hidden="true" />
            <Card className="w-full max-w-md border-white/20 bg-card/90 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <CardHeader>
                    <CardDescription>QMaster · The Smart Assessment Platform.</CardDescription>
                    <CardTitle className="text-3xl">Welcome back</CardTitle>
                    <CardDescription>Sign in to view and create questions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {registered === "1" && (
                        <Alert>
                            <AlertDescription>
                                Account created! Sign in below to get started.
                            </AlertDescription>
                        </Alert>
                    )}
                    <LoginForm />
                </CardContent>
                <Link href="/register" className="mb-5 block text-center text-sm underline">
                    Create a student account
                </Link>
            </Card>
        </main>
    );
}
