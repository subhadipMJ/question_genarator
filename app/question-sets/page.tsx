import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getQuestionSets, type QuestionSetItem } from "../services/question-sets";
import QuestionSetsManager from "./question-sets-manager";

export const metadata = {
    title: "Question Sets | Safalya",
    description: "Curate and manage reusable question sets and bundles.",
};

export default async function QuestionSetsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const role = cookieStore.get("user_role")?.value;

    if (!token) redirect("/login");
    if (!role || !["0", "1", "2"].includes(role)) redirect("/student/tests");

    let questionSets: QuestionSetItem[] = [];
    try {
        questionSets = await getQuestionSets();
    } catch (err) {
        console.error("Failed to load question sets:", err);
    }

    return (
        <main className="p-6">
            <QuestionSetsManager initialSets={questionSets} userRole={role} />
        </main>
    );
}
