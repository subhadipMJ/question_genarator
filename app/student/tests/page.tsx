import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiUrl } from "../../lib/api-url";
import { getOrganization } from "../../services/organizations";
import StudentTests from "./student-tests";

export type AvailableTest = {
    id: number;
    name: string;
    org_id: number;
    valid_until: string;
    duration_seconds: number;
    question_count: number;
};

export type AttemptSummary = {
    id: number;
    series_id: number;
    series_name: string;
    started_at: string;
    expires_at: string;
    submitted_at: string | null;
    status: string;
    score: string;
    total_marks: string;
};

export default async function Page() {
    const s = await cookies();
    const token = s.get("access_token")?.value;
    if (!token) redirect("/login");
    if (s.get("user_role")?.value !== "3") redirect("/dashboard");

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch available tests AND attempt history in parallel
    const [testsRes, historyRes] = await Promise.all([
        fetch(getApiUrl("student/test-series"), { headers, cache: "no-store" }),
        fetch(getApiUrl("student/attempt-history"), { headers, cache: "no-store" }),
    ]);

    const tests: AvailableTest[] = testsRes.ok ? await testsRes.json() : [];
    const history: AttemptSummary[] = historyRes.ok ? await historyRes.json() : [];

    const orgIds = [...new Set(tests.map((t) => t.org_id).filter((id) => id > 0))];
    const orgResults = await Promise.allSettled(orgIds.map((id) => getOrganization(id)));
    const organizations = Object.fromEntries(
        orgResults.flatMap((res) =>
            res.status === "fulfilled" ? [[res.value.id, res.value.name]] : [],
        )
    );

    return (
        <main className="p-6">
            <StudentTests tests={tests} history={history} organizations={organizations} />
        </main>
    );
}
