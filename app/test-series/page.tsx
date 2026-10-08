import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllTestSeries } from "../services/test-series";
import { getAllTeacherGroups } from "../services/teacher-groups";
import { getOrganization } from "../services/organizations";
import TestSeriesManager from "./test-series-manager";

export const metadata = {
    title: "Test  | Safalya",
    description: "Create and manage test for your students.",
};

export default async function TestSeriesPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const role = cookieStore.get("user_role")?.value;

    if (!token) redirect("/login");
    if (!role || !["0", "1", "2"].includes(role)) redirect("/student/tests");

    async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T | []> {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error: any) {
                console.warn(`[Retry ${i + 1}/${retries}] Fetch failed:`, error?.message || error);
                if (i === retries - 1) return [];
                await new Promise(res => setTimeout(res, delayMs * Math.pow(2, i)));
            }
        }
        return [];
    }

    const [seriesRes, groupsRes] = await Promise.allSettled([
        fetchWithRetry(getAllTestSeries),
        getAllTeacherGroups(),
    ]);

    const series = (seriesRes.status === "fulfilled" ? seriesRes.value : []) as any[];
    const teacherGroups = groupsRes.status === "fulfilled" ? groupsRes.value : [];
    const teacherGroupIds = new Set(teacherGroups.map((g: any) => g.id));

    const organizationId = Number(cookieStore.get("organization_id")?.value) || 0;
    const userId = Number(cookieStore.get("user_id")?.value) || 0;

    const visibleSeries = series.filter((s) => {
        if (organizationId && s.org_id && s.org_id !== organizationId) return false;
        if (role === "1") return true;
        if (role === "2") {
            if (s.created_by === userId || s.supervisor_id === userId) return true;
            if (s.teacher_group_id && teacherGroupIds.has(s.teacher_group_id)) return true;
            return false;
        }
        return true;
    });

    const orgIds = [...new Set(visibleSeries.map((s) => s.org_id).filter((id) => id > 0))];
    const orgResults = await Promise.allSettled(orgIds.map((id) => getOrganization(id)));
    const organizations = Object.fromEntries(
        orgResults.flatMap((res) =>
            res.status === "fulfilled" ? [[res.value.id, res.value.name]] : [],
        )
    );

    return (
        <main className="p-6">
            <TestSeriesManager
                initialSeries={visibleSeries}
                organizations={organizations}
                userId={userId}
                userRole={role}
                userOrgId={organizationId}
            />
        </main>
    );
}
