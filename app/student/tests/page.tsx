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
    topics?: string[];
};

export type PaginatedTests = {
    items: AvailableTest[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
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

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{
        q?: string;
        topic?: string;
        org_id?: string;
        sort_order?: string;
        page?: string;
        limit?: string;
    }>;
}) {
    const s = await cookies();
    const token = s.get("access_token")?.value;
    if (!token) redirect("/login");
    if (s.get("user_role")?.value !== "3") redirect("/dashboard");

    const params = await searchParams;
    const queryStr = new URLSearchParams();
    if (params.q) queryStr.set("q", params.q);
    if (params.topic) queryStr.set("topic", params.topic);
    if (params.org_id) queryStr.set("org_id", params.org_id);
    if (params.sort_order) queryStr.set("sort_order", params.sort_order);
    if (params.page) queryStr.set("page", params.page);
    if (params.limit) queryStr.set("limit", params.limit);

    const headers = { Authorization: `Bearer ${token}` };

    const [testsRes, historyRes, topicsRes] = await Promise.all([
        fetch(getApiUrl(`student/test-series?${queryStr.toString()}`), { headers, cache: "no-store" }),
        fetch(getApiUrl("student/attempt-history"), { headers, cache: "no-store" }),
        fetch(getApiUrl("topics/"), { headers, cache: "no-store" }),
    ]);

    const paginatedTests: PaginatedTests = testsRes.ok
        ? await testsRes.json()
        : { items: [], total: 0, page: 1, limit: 10, total_pages: 1 };
    const history: AttemptSummary[] = historyRes.ok ? await historyRes.json() : [];
    const allTopicsData: { id: number; name: string }[] = topicsRes.ok ? await topicsRes.json() : [];

    const orgIds = [...new Set(paginatedTests.items.map((t) => t.org_id).filter((id) => id > 0))];
    const orgResults = await Promise.allSettled(orgIds.map((id) => getOrganization(id)));
    const organizations = Object.fromEntries(
        orgResults.flatMap((res) =>
            res.status === "fulfilled" ? [[res.value.id, res.value.name]] : [],
        )
    );

    const topicNames = allTopicsData.map((t) => t.name);

    return (
        <main className="p-6">
            <StudentTests
                paginatedTests={paginatedTests}
                history={history}
                organizations={organizations}
                allTopicNames={topicNames}
                initialParams={{
                    q: params.q ?? "",
                    topic: params.topic ?? "",
                    org_id: params.org_id ?? "",
                    sort_order: params.sort_order ?? "asc",
                    page: Number(params.page ?? "1"),
                    limit: Number(params.limit ?? "10"),
                }}
            />
        </main>
    );
}


