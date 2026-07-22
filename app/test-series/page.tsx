import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiUrl } from "../lib/api-url";
import { getAllTestSeries } from "../services/test-series";
import { getAllQuestionsList } from "../services/questions";
import { getAllTopics } from "../services/topics";
import { getOrganization } from "../services/organizations";
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

    const [series, allQuestions, topics] = await Promise.all([
        getAllTestSeries().catch((e) => { console.error("[TestSeries] fetch error:", e?.message || e); return []; }),
        getAllQuestionsList().catch(() => []),
        getAllTopics().catch(() => []),
    ]);


    const organizationId = Number(cookieStore.get("organization_id")?.value);
    const userId = Number(cookieStore.get("user_id")?.value);

    // Filter test series for teacher role
    const teacherSeries = role === "2" ? series.filter((s) => s.created_by === userId) : series;

    const orgIds = [...new Set(teacherSeries.map((s) => s.org_id).filter((id) => id > 0))];
    const orgResults = await Promise.allSettled(orgIds.map((id) => getOrganization(id)));
    const organizations = Object.fromEntries(
        orgResults.flatMap((res) =>
            res.status === "fulfilled" ? [[res.value.id, res.value.name]] : [],
        )
    );

    // Filter questions by role: superadmin sees globals, admin/teacher sees available questions
    const questions = allQuestions.filter((q) => {
        if (role === "0") return q.is_global;
        if (role === "1") return true;
        return q.user_id === userId || !q.is_global;
    });


    return (
        <main className="p-6">
            <TestSeriesManager
                initialSeries={teacherSeries}
                organizations={organizations}
                questions={questions}
                topics={topics}
                userId={userId}
                userRole={role}
                userOrgId={organizationId}
            />
        </main>
    );
}
