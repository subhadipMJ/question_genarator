import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ROLE_NAMES: Record<string, string> = {
    0: "Super Admin",
    1: "Admin",
    2: "Teacher",
    3: "Student",
};

export const metadata = {
    title: "Dashboard | Question Generator",
};

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) redirect("/login");

    const userName = cookieStore.get("user_name")?.value ?? "User";
    const roleValue = cookieStore.get("user_role")?.value;
    const roleName = roleValue ? ROLE_NAMES[roleValue] ?? "User" : "User";
    const isSuperAdmin = roleValue === "0";

    return (
        <main className="flex min-h-screen items-center justify-center px-6">
            <section className="w-full max-w-xl rounded-2xl border border-gray-200 p-8 text-center shadow-sm dark:border-gray-800">
                <p className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-500">
                    Dashboard
                </p>
                <h1 className="text-3xl font-bold">
                    Welcome, {roleName} {userName}
                </h1>

                <div className="mt-8 flex justify-center gap-3">
                    {isSuperAdmin && (
                        <Link
                            href="/super-admin"
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
                        >
                            Super admin
                        </Link>
                    )}
                    <Link
                        href="/questions"
                        className="rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
                    >
                        View questions
                    </Link>
                    <form action="/api/auth/logout" method="post">
                        <button className="rounded-lg border px-4 py-2">Log out</button>
                    </form>
                </div>
            </section>
        </main>
    );
}
