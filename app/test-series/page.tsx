import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiUrl } from "../lib/api-url";
import { getAllTestSeries } from "../services/test-series";
import { getAllQuestions } from "../services/questions";
import TestSeriesManager from "./test-series-manager";

export const metadata = {
    title: "Test Series | QMaster",
    description: "Create and manage test series for your students.",
};

export default async function TestSeriesPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const role = cookieStore.get("user_role")?.value;

    if (!token) redirect("/login");
    if (!role || !["0", "1", "2"].includes(role)) redirect("/student/tests");

    const [series, allQuestions] = await Promise.all([
        getAllTestSeries().catch(() => []),
        getAllQuestions().catch(() => []),
    ]);

    const organizationId = Number(cookieStore.get("organization_id")?.value);
    const userId = Number(cookieStore.get("user_id")?.value);

    // Filter questions by role: superadmin sees globals, admin sees org questions, teacher sees own
    const questions = allQuestions.filter((q) => {
        if (role === "0") return q.is_global;
        if (role === "1") return !q.is_global && q.organization_id === organizationId;
        return q.user_id === userId;
    });

    return (
        <main className="p-6">
            <TestSeriesManager initialSeries={series} questions={questions} />
        </main>
    );
}
