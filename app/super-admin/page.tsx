import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllUsers } from "../services/users";

const ROLE_NAMES: Record<number, string> = {
    0: "Super Admin",
    1: "Admin",
    2: "Teacher",
    3: "Student",
};

export const metadata = {
    title: "Super Admin | Question Generator",
};

export default async function SuperAdminPage() {
    const cookieStore = await cookies();

    if (!cookieStore.has("access_token")) redirect("/login");
    if (cookieStore.get("user_role")?.value !== "0") redirect("/dashboard");

    const userName = cookieStore.get("user_name")?.value ?? "Super Admin";
    const users = await getAllUsers();

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-950">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                            Super Admin
                        </p>
                        <h1 className="mt-2 text-3xl font-bold">Welcome, {userName}</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Manage the Question Generator platform.
                        </p>
                    </div>
                    <form action="/api/auth/logout" method="post">
                        <button className="rounded-lg border px-4 py-2">Log out</button>
                    </form>
                </div>

                <section className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Link
                        href="/questions"
                        className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                    >
                        <h2 className="text-xl font-semibold">Manage questions</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            View existing questions and create new ones.
                        </p>
                    </Link>

                    <Link
                        href="/organizations/create"
                        className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                    >
                        <h2 className="text-xl font-semibold">Create organization</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Add an organization and its first administrator.
                        </p>
                    </Link>

                    <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <h2 className="text-xl font-semibold">Manage users</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {users.length} registered {users.length === 1 ? "user" : "users"}.
                        </p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="border-b px-6 py-4 dark:border-gray-800">
                        <h2 className="text-xl font-semibold">All users</h2>
                    </div>

                    {users.length === 0 ? (
                        <p className="px-6 py-10 text-center text-gray-500">No users found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Name</th>
                                        <th className="px-6 py-3 font-medium">Email</th>
                                        <th className="px-6 py-3 font-medium">Role</th>
                                        <th className="px-6 py-3 font-medium">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-800">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 font-medium">{user.name}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                                                    {ROLE_NAMES[user.role] ?? `Role ${user.role}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                {new Intl.DateTimeFormat("en", {
                                                    dateStyle: "medium",
                                                }).format(new Date(user.created_at))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <Link href="/dashboard" className="mt-8 inline-block text-sm underline">
                    Back to dashboard
                </Link>
            </div>
        </main>
    );
}
