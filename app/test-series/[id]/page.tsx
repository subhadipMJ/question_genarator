import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getTestSeries } from "../../services/test-series";
import { getQuestionsByIds, type Question } from "../../services/questions";
import { getTestSeriesQuestions } from "../../services/student";
import { getOrganizationUsers } from "../../services/organizations";
import { getAllTeacherGroups } from "../../services/teacher-groups";
import { getStudentBatches } from "../../services/student-batches";
import TestSeriesEditor from "./test-series-editor";

export const metadata = {
    title: "Edit Test Series | Safalya",
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
    const organizationId = Number(cookieStore.get("organization_id")?.value) || 0;
    const userId = Number(cookieStore.get("user_id")?.value);

    if (!token) redirect("/login");
    if (!role || !["0", "1", "2"].includes(role)) redirect("/student/tests");

    const { id } = await params;
    const seriesId = Number(id);
    if (isNaN(seriesId)) notFound();

    // Fetch details and test series questions
    const [series, orgUsers, teacherGroups, studentBatches, seriesQuestionsPayload] = await Promise.all([
        getTestSeries(seriesId).catch(() => null),
        organizationId ? getOrganizationUsers(organizationId).catch(() => []) : Promise.resolve([]),
        getAllTeacherGroups().catch(() => []),
        getStudentBatches().catch(() => []),
        getTestSeriesQuestions<any>(seriesId).catch(() => null),
    ]);

    if (!series) notFound();

    // Permission enforcement:
    const canEdit =
        (role === "0" && series.org_id === 0) ||
        (role === "1" && series.org_id === organizationId) ||
        series.created_by === userId ||
        series.supervisor_id === userId ||
        Boolean(series.teacher_group_id);

    if (!canEdit) redirect("/test-series");

    // Build map from the test series questions endpoint (authoritative for this series)
    const questionsMap = new Map<number, Question>();
    if (seriesQuestionsPayload?.questions && Array.isArray(seriesQuestionsPayload.questions)) {
        for (const sq of seriesQuestionsPayload.questions) {
            questionsMap.set(sq.question_id, {
                id: sq.question_id,
                question: sq.question,
                organization_id: sq.organization_id ?? series.org_id,
                user_id: sq.user_id ?? 0,
                is_global: false,
                marks: String(sq.marks ?? 1),
                is_active: sq.is_active ?? true,
                topic_id: sq.topic_id,
                topic: sq.topic,
                options: (sq.options || []).map((opt: any) => ({
                    id: opt.id,
                    q_id: sq.question_id,
                    ans: opt.ans || opt.text || "",
                    is_correct: Boolean(opt.is_correct),
                    diagram_path: opt.diagram_path,
                })),
                diagram_path: sq.diagram_path,
                diagrams: sq.diagrams,
            });
        }
    }

    // Also fetch from question bank for any questions not already in the map
    const missingIds = (series.questions || [])
        .map((q) => q.question_id)
        .filter((id) => !questionsMap.has(id));

    if (missingIds.length > 0) {
        const questionFilters = role === "0"
            ? { isGlobal: true }
            : role === "1"
                ? { isGlobal: false, organizationId }
                : {};
        const fetchedQuestions = await getQuestionsByIds(missingIds, questionFilters).catch(() => []);
        for (const q of fetchedQuestions) {
            questionsMap.set(q.id, q);
        }
    }

    const questions = (series.questions || [])
        .map((sq) => questionsMap.get(sq.question_id))
        .filter((q): q is Question => q !== undefined);

    return (
        <>
            <TestSeriesEditor
                series={series}
                availableQuestions={questions}
                organizationUsers={orgUsers}
                teacherGroups={teacherGroups}
                studentBatches={studentBatches}
                userId={userId}
                userRole={role}
                userOrgId={organizationId}
            />
        </>
    );
}
