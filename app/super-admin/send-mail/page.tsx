import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllUsers } from "../../services/users";
import SendMailForm from "./send-mail-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Send Email | Super Admin | QMaster" };

export default async function SendMailPage() {
    const cookieStore = await cookies();

    if (!cookieStore.has("access_token")) redirect("/login");
    if (cookieStore.get("user_role")?.value !== "0") redirect("/dashboard");

    const users = await getAllUsers().catch(() => []);

    return (
        <main className="px-6 py-12">
            <div className="mx-auto max-w-2xl">
                <Button variant="ghost" nativeButton={false} render={<Link href="/super-admin" />}>
                    ← Back to super admin
                </Button>
                <Card className="mt-4">
                    <CardHeader>
                        <CardDescription>Super Admin</CardDescription>
                        <CardTitle className="text-3xl">Send email</CardTitle>
                        <CardDescription>
                            Compose and dispatch an email to any recipient or select from registered users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SendMailForm users={users} />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
