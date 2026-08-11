import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApiUrl } from "../../lib/api-url";
import { HistorySearch } from "./history-search"; // adjust path to wherever you save File 1

type History = {
    id: number;
    series_name: string;
    started_at: string;
    submitted_at: string | null;
    status: number | string;
    score: string;
    total_marks: string;
};

export default async function Page() {
    const s = await cookies();
    const token = s.get("access_token")?.value;

    if (!token) redirect("/login");
    if (s.get("user_role")?.value !== "3") redirect("/dashboard");

    const r = await fetch(getApiUrl("student/attempt-history"), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    const allHistory = r.ok ? (await r.json() as History[]) : [];

    return (
        <main className="mx-auto max-w-7xl p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attempt history</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Review your completed assessments, scores, and answer keys.
                </p>
            </div>

            <HistorySearch allHistory={allHistory} />
        </main>
    );
}