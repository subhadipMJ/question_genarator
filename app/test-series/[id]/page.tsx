import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getTestSeries } from "../../services/test-series";
import { getAllQuestionsList } from "../../services/questions";
import { getAllTopics } from "../../services/topics";
import TestSeriesEditor from "./test-series-editor";

export const metadata = {
    title: "Edit Test Series | QMaster",
    description: "Edit details and configure questions for your test series.",
};

type RouteParams = {
    id: string;
};

export default async function EditTestSeriesPage({
    params,
}: {
    params: Promise<RouteParams>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const role = cookieStore.get("user_role")?.value;

    if (!token) redirect("/login");
    if (!role || !["0", "1", "2"].includes(role)) redirect("/student/tests");

    const { id } = await params;
    const seriesId = Number(id);
    if (isNaN(seriesId)) notFound();

    // Fetch details
    const [series, allQuestions, topics] = await Promise.all([
        getTestSeries(seriesId).catch(() => null),
        getAllQuestionsList().catch(() => []),
        getAllTopics().catch(() => []),
    ]);

    if (!series) notFound();

    const organizationId = Number(cookieStore.get("organization_id")?.value);
    const userId = Number(cookieStore.get("user_id")?.value);

    // Permission enforcement:
    const canEdit =
        (role === "0" && series.org_id === 0) ||
        (role === "1" && series.org_id === organizationId) ||
        series.created_by === userId;

    if (!canEdit) redirect("/test-series");

    // Filter available questions to add by role:
    const questions = allQuestions.filter((q) => {
        if (role === "0") return q.is_global;
        if (role === "1") return !q.is_global && q.organization_id === organizationId;
        return q.user_id === userId;
    });

    return (
        <main className="p-6">
            <TestSeriesEditor
                series={series}
                availableQuestions={questions}
                topics={topics}
                userId={userId}
                userRole={role}
                userOrgId={organizationId}
            />
        </main>
    );
}
