import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OrganizationForm from "./organization-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Create Organization | QMaster" };

export default async function CreateOrganizationPage() {
    const cookieStore = await cookies();

    if (!cookieStore.has("access_token")) redirect("/login");
    if (cookieStore.get("user_role")?.value !== "0") redirect("/dashboard");

    return (
        <main className="px-6 py-12">
            <div className="mx-auto max-w-2xl">
                <Button variant="ghost" render={<Link href="/super-admin" />}>← Back to super admin</Button>
                <Card className="mt-4">
                    <CardHeader><CardDescription>Super Admin</CardDescription><CardTitle className="text-3xl">Create organization</CardTitle><CardDescription>Set up an organization and its first administrator account.</CardDescription></CardHeader>
                    <CardContent><OrganizationForm /></CardContent>
                </Card>
            </div>
        </main>
    );
}
