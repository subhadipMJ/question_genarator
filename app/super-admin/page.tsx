import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllUsers } from "../services/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ROLE_NAMES: Record<number, string> = {
    0: "Super Admin",
    1: "Admin",
    2: "Teacher",
    3: "Student",
};

export const metadata = {
    title: "Super Admin | QMaster",
};

export default async function SuperAdminPage() {
    const cookieStore = await cookies();

    if (!cookieStore.has("access_token")) redirect("/login");
    if (cookieStore.get("user_role")?.value !== "0") redirect("/dashboard");

    const userName = cookieStore.get("user_name")?.value ?? "Super Admin";
    const users = await getAllUsers();

    return (
        <main className="px-6 py-12">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">
                            Super Admin
                        </p>
                        <h1 className="mt-2 text-3xl font-bold">Welcome, {userName}</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage QMaster, The Smart Assessment Platform.
                        </p>
                    </div>
                    <form action="/api/auth/logout" method="post">
                        <Button type="submit" variant="outline">Log out</Button>
                    </form>
                </div>

                <section className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Card className="transition-colors hover:bg-accent/50"><Link href="/questions"><CardHeader><CardTitle>Manage questions</CardTitle><CardDescription>View existing questions and create new ones.</CardDescription></CardHeader></Link></Card>

                    <Card className="transition-colors hover:bg-accent/50"><Link href="/organizations/create"><CardHeader><CardTitle>Create organization</CardTitle><CardDescription>Add an organization and its first administrator.</CardDescription></CardHeader></Link></Card>

                    <Card><CardHeader><CardTitle>Manage users</CardTitle><CardDescription>{users.length} registered {users.length === 1 ? "user" : "users"}.</CardDescription></CardHeader></Card>
                </section>

                <Card>
                    <CardHeader><CardTitle>All users</CardTitle></CardHeader>
                    <CardContent>

                    {users.length === 0 ? (
                        <p className="text-muted-foreground px-6 py-10 text-center">No users found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>
                                                {user.email}
                                            </TableCell>
                                            <TableCell><Badge variant="secondary">{ROLE_NAMES[user.role] ?? `Role ${user.role}`}</Badge></TableCell>
                                            <TableCell>
                                                {new Intl.DateTimeFormat("en", {
                                                    dateStyle: "medium",
                                                }).format(new Date(user.created_at))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    </CardContent>
                </Card>

                <Button variant="ghost" className="mt-8" render={<Link href="/dashboard" />}>← Back to dashboard</Button>
            </div>
        </main>
    );
}
