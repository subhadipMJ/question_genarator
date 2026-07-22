import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOrganizationUsers } from "../services/organizations";
import type { User } from "../services/users";
import UserManager from "./user-manager";

export const metadata = {
    title: "Users Management | QMaster",
};

export default async function UsersPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) redirect("/login");

    const role = cookieStore.get("user_role")?.value;
    // Only organization admins (role 1) can manage users under their org
    if (role !== "1") redirect("/dashboard");

    const organizationId = Number(cookieStore.get("organization_id")?.value);
    const organizationName = cookieStore.get("organization_name")?.value ?? "Organization";

    if (!organizationId) {
        redirect("/dashboard");
    }

    let initialUsers: User[] = [];
    try {
        initialUsers = await getOrganizationUsers(organizationId);
    } catch (error) {
        console.error("Error fetching organization users:", error);
    }

    return (
        <main className="mx-auto max-w-6xl">
            <div className="mb-8">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    {organizationName}
                </p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Users Management</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    Manage, search, and add students and teachers within your organization.
                </p>
            </div>
            
            <UserManager initialUsers={initialUsers} organizationId={organizationId} />
        </main>
    );
}
