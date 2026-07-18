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
        <main
            className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-black bg-cover bg-center px-4 py-12"
            style={{ backgroundImage: "url('https://cdn.pixabay.com/photo/2024/12/28/01/27/ai-generated-9295105_1280.jpg')" }}
        >
            <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden="true" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent,rgb(0_0_0_/_0.45))]" aria-hidden="true" />
            <Card className="w-full max-w-md border-white/20 bg-card/90 shadow-2xl shadow-black/30 backdrop-blur-xl">
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
