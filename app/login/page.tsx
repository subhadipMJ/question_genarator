import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
    title: "Sign in | QMaster",
};

export default async function LoginPage() {
    if ((await cookies()).has("access_token")) {
        redirect("/questions");
    }

    return (
        <main className="flex  items-center justify-center px-6 py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardDescription>QMaster · The Smart Assessment Platform.</CardDescription>
                    <CardTitle className="text-3xl">Welcome back</CardTitle>
                    <CardDescription>Sign in to view and create questions.</CardDescription>
                </CardHeader>
                <CardContent><LoginForm /></CardContent>
            </Card>
        </main>
    );
}
