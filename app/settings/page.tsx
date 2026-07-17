import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOrganization } from "../services/organizations";
import OrganizationSettings from "../dashboard/organization-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
    title: "Settings | QMaster",
};

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const roleValue = cookieStore.get("user_role")?.value;

    if (!token) redirect("/login");
    // Settings is only accessible by Admin (role === "1")
    if (roleValue !== "1") redirect("/dashboard");

    const organizationId = Number(cookieStore.get("organization_id")?.value);
    const organization = Number.isInteger(organizationId) && organizationId > 0
        ? await getOrganization(organizationId)
        : null;

    if (!organization) {
        return (
            <main className="mx-auto mt-8 max-w-3xl px-6">
                <p className="text-muted-foreground text-center">Organization not found.</p>
            </main>
        );
    }

    return (
        <main className="mx-auto mt-8 max-w-3xl px-6">
            <Card>
                <CardHeader>
                    <CardTitle>Organization Settings</CardTitle>
                    <CardDescription>Update your organization name, location, and phone number.</CardDescription>
                </CardHeader>
                <CardContent>
                    <OrganizationSettings initialOrganization={organization} />
                </CardContent>
            </Card>
        </main>
    );
}
