import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTestSeriesResults, getTestSeries } from "../../../services/test-series";
import { getTeacherGroup } from "../../../services/teacher-groups";
import ResultsViewer from "./results-viewer";

export const metadata = {
    title: "Test Series Results | Safalya",
    description: "View student attempt results and scores for this test series.",
};

export default async function TestSeriesResultsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const role = cookieStore.get("user_role")?.value;
    const userId = Number(cookieStore.get("user_id")?.value);

    if (!token) redirect("/login");
    if (!role || !["0", "1", "2"].includes(role)) redirect("/student/tests");

    const { id } = await params;
    const seriesId = Number(id);
    if (isNaN(seriesId)) redirect("/test-series");

    const [results, series] = await Promise.all([
        getTestSeriesResults(seriesId).catch((err) => {
            console.error("Failed to fetch results:", err);
            return null;
        }),
        getTestSeries(seriesId).catch(() => null),
    ]);

    if (!results) {
        redirect("/test-series");
    }

    // Role-based publish permission:
    // Super admin (0) or Org admin (1) can always publish
    let canPublish = role === "0" || role === "1";

    if (!canPublish && role === "2") {
        if (series?.supervisor_id === userId) {
            canPublish = true;
        } else if (series?.teacher_group_id) {
            const tg = await getTeacherGroup(series.teacher_group_id).catch(() => null);
            if (tg?.supervisor === userId) {
                canPublish = true;
            }
        }
    }

    return (
        <main className="p-6">
            <ResultsViewer initialResults={results} canPublish={canPublish} />
        </main>
    );
}
