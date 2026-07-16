import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OrganizationForm from "./organization-form";

export const metadata = { title: "Create Organization | Question Generator" };

export default async function CreateOrganizationPage() {
    const cookieStore = await cookies();

    if (!cookieStore.has("access_token")) redirect("/login");
    if (cookieStore.get("user_role")?.value !== "0") redirect("/dashboard");

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-950">
            <div className="mx-auto max-w-2xl">
                <Link href="/super-admin" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">← Back to super admin</Link>
                <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
                    <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Super Admin</p>
                    <h1 className="mt-2 text-3xl font-bold">Create organization</h1>
                    <p className="mt-2 mb-8 text-gray-600 dark:text-gray-400">Set up an organization and its first administrator account.</p>
                    <OrganizationForm />
                </div>
            </div>
        </main>
    );
}
