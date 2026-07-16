import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_NAMES: Record<string, string> = {
    0: "Super Admin",
    1: "Admin",
    2: "Teacher",
    3: "Student",
};

export const metadata = {
    title: "Dashboard | QMaster",
};

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) redirect("/login");

    const userName = cookieStore.get("user_name")?.value ?? "User";
    const roleValue = cookieStore.get("user_role")?.value;
    if (roleValue === "0") redirect("/super-admin");

    const roleName = roleValue ? ROLE_NAMES[roleValue] ?? "User" : "User";

    return (
        <main className="flex h-full mt-8 items-center justify-center px-6">
            <Card className="w-full max-w-xl text-center">
                <CardHeader>
                    <CardDescription>Dashboard</CardDescription>
                    <CardTitle className="text-3xl">Welcome, {roleName} {userName}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap justify-center gap-3">
                    <Button nativeButton={false} render={<Link href="/questions" />}>View questions</Button>
                    <form action="/api/auth/logout" method="post">
                        <Button type="submit" variant="outline">Log out</Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
