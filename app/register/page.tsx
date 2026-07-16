import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import RegisterForm from "./register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
    title: "Create account | QMaster",
    description: "Create a free student account on QMaster.",
};

export default async function RegisterPage() {
    // If already logged in, go to dashboard
    if ((await cookies()).has("access_token")) {
        redirect("/dashboard");
    }

    return (
        <main className="flex min-h-[90vh] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardDescription>QMaster · The Smart Assessment Platform.</CardDescription>
                    <CardTitle className="text-3xl">Create an account</CardTitle>
                    <CardDescription>Sign up as a student to take tests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm />
                </CardContent>
                <Link href="/login" className="mb-5 block text-center text-sm underline">
                    Already have an account? Sign in
                </Link>
            </Card>
        </main>
    );
}
