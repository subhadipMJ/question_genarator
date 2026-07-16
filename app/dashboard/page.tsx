import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOrganization } from "../services/organizations";
import OrganizationSettings from "./organization-settings";
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
    if (roleValue === "3") redirect("/student/tests");

    const roleName = roleValue ? ROLE_NAMES[roleValue] ?? "User" : "User";
    const organizationId = Number(cookieStore.get("organization_id")?.value);
    const organization = roleValue === "1" && Number.isInteger(organizationId) && organizationId > 0
        ? await getOrganization(organizationId)
        : null;

    return (
        <main className="mx-auto mt-8 grid max-w-3xl gap-6 px-6">
            <Card className="text-center">
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

            {organization && (
                <Card>
                    <CardHeader>
                        <CardTitle>Organization settings</CardTitle>
                        <CardDescription>Update your organization name, location, and phone number.</CardDescription>
                    </CardHeader>
                    <CardContent><OrganizationSettings initialOrganization={organization} /></CardContent>
                </Card>
            )}
        </main>
    );
}
