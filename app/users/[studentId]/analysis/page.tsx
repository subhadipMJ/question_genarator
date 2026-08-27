import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStudentHistory } from "../../../services/users";
import AnalysisViewer from "./analysis-viewer";

export const metadata = {
    title: "Student Analysis | QMaster",
    description: "View student performance analysis and history.",
};

export default async function StudentAnalysisPage({
    params,
}: {
    params: Promise<{ studentId: string }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const role = cookieStore.get("user_role")?.value;

    if (!token) redirect("/login");
    // Organization admins can manage users
    if (role !== "1") redirect("/dashboard");

    const { studentId } = await params;
    const id = Number(studentId);
    if (isNaN(id)) redirect("/users");

    const results = await getStudentHistory(id).catch((err) => {
        console.error("Failed to fetch student history:", err);
        return null;
    });

    if (!results) {
        redirect("/users");
    }

    return (
        <main className="p-6">
            <AnalysisViewer initialData={results} />
        </main>
    );
}
