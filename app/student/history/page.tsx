import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { HistorySearch } from "./history-search";
import { getAttemptHistory, type AttemptHistory } from "../../services/student";

export default async function Page() {
    const s = await cookies();
    if (!s.has("access_token")) redirect("/login");
    if (s.get("user_role")?.value !== "3") redirect("/dashboard");

    const allHistory: AttemptHistory[] = await getAttemptHistory().catch(() => []);

    return (
        <main className="mx-auto max-w-4xl p-6 space-y-3">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attempt history</h1>
            </div>
            <HistorySearch allHistory={allHistory} />
        </main>
    );
}