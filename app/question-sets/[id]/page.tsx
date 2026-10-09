import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getQuestionSet } from "../../services/question-sets";
import QuestionSetEditor from "./question-set-editor";

export const metadata = {
    title: "Question Set Editor | Safalya",
};

export default async function QuestionSetDetailPage({
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

    let setDetail;
    try {
        setDetail = await getQuestionSet(id);
    } catch (err) {
        notFound();
    }

    return (
        <main className="p-6">
            <QuestionSetEditor initialSet={setDetail} userRole={role} />
        </main>
    );
}
