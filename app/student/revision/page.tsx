import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getRevisionQuestions, type RevisionQuestionsResponse } from "../../services/student";
import RevisionViewer from "./revision-viewer";

export const metadata = {
    title: "Mistake Notebook & Revision | Safalya",
};

export default async function Page() {
    const cookieStore = await cookies();
    if (!cookieStore.has("access_token")) redirect("/login");
    if (cookieStore.get("user_role")?.value !== "3") redirect("/dashboard");

    let data: RevisionQuestionsResponse = {
        total: 0,
        items: [],
        available_series: [],
    };

    try {
        data = await getRevisionQuestions({ filter_type: "all", limit: 100 });
    } catch (err) {
        console.error("Failed to load revision questions:", err);
    }

    return (
        <main className="mx-auto max-w-7xl p-6">
            <RevisionViewer initialData={data} />
        </main>
    );
}
