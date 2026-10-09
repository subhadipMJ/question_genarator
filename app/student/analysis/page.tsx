import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getStudentHistory, type StudentHistoryResponse } from "../../services/users";
import StudentAnalysisViewer from "./student-analysis-viewer";

export const metadata = {
    title: "Performance Analysis | Safalya",
};

export default async function Page() {
    const cookieStore = await cookies();
    if (!cookieStore.has("access_token")) redirect("/login");
    if (cookieStore.get("user_role")?.value !== "3") redirect("/dashboard");

    const userId = Number(cookieStore.get("user_id")?.value) || 0;

    let data: StudentHistoryResponse = {
        student_id: userId,
        student_name: cookieStore.get("user_name")?.value || "Student",
        student_email: "",
        total_tests: 0,
        history: [],
    };

    if (userId > 0) {
        try {
            data = await getStudentHistory(userId);
        } catch (err) {
            console.error("Failed to load student analysis history:", err);
        }
    }

    return (
        <main className="mx-auto max-w-7xl p-6">
            <StudentAnalysisViewer initialData={data} />
        </main>
    );
}
