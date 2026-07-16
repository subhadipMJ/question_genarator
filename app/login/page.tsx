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
        <main className="flex min-h-[90vh] items-center justify-center">
            <Card className="w-full max-w-md">
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
