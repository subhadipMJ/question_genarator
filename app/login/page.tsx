import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export const metadata = {
    title: "Sign in | Question Generator",
};

export default async function LoginPage() {
    if ((await cookies()).has("access_token")) {
        redirect("/questions");
    }

    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
            <section className="w-full max-w-md rounded-2xl border border-gray-200 p-8 shadow-sm dark:border-gray-800">
                <div className="mb-8">
                    <p className="mb-2 text-sm font-medium text-gray-500">Question Generator</p>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sign in to view and create questions.
                    </p>
                </div>
                <LoginForm />
            </section>
        </main>
    );
}
