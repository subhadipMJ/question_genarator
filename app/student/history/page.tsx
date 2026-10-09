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
        <main className="mx-auto max-w-7xl p-6">
            <HistorySearch allHistory={allHistory} />
        </main>
    );
}