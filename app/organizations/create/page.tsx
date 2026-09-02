import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OrganizationForm from "./organization-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Register Organization | QMaster" };

export default async function CreateOrganizationPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const role = cookieStore.get("user_role")?.value;

    if (token && role !== "0") {
        redirect("/dashboard");
    }

    const isSuperAdmin = token && role === "0";

    return (
        <main className="px-6 py-12">
            <div className="mx-auto max-w-2xl">
                <Button variant="ghost" nativeButton={false} render={<Link href={isSuperAdmin ? "/super-admin" : "/login"} />}>
                    ← {isSuperAdmin ? "Back to super admin" : "Back to sign in"}
                </Button>
                <Card className="mt-4">
                    <CardHeader>
                        <CardDescription>{isSuperAdmin ? "Super Admin" : "Institution Onboarding"}</CardDescription>
                        <CardTitle className="text-3xl">Register Organization</CardTitle>
                        <CardDescription>
                            {isSuperAdmin
                                ? "Set up an active organization and its administrator account."
                                : "Register your organization. Your account will be pending activation by a Super Admin."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OrganizationForm isSuperAdmin={Boolean(isSuperAdmin)} />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
