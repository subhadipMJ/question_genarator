import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTestSeriesResults } from "../../../services/test-series";
import ResultsViewer from "./results-viewer";

export const metadata = {
    title: "Test Series Results | QMaster",
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

    if (!token) redirect("/login");
    if (!role || !["0", "1", "2"].includes(role)) redirect("/student/tests");

    const { id } = await params;
    const seriesId = Number(id);
    if (isNaN(seriesId)) redirect("/test-series");

    const results = await getTestSeriesResults(seriesId).catch((err) => {
        console.error("Failed to fetch results:", err);
        return null;
    });

    if (!results) {
        redirect("/test-series");
    }

    return (
        <main className="p-6">
            <ResultsViewer initialResults={results} />
        </main>
    );
}
