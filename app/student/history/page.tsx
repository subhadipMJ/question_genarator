import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiUrl } from "../../lib/api-url";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type History = {
    id: number;
    series_name: string;
    started_at: string;
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

    const r = await fetch(getApiUrl("student/attempt-history"), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    const history = r.ok ? (await r.json() as History[]) : [];

    return (
        <main className="mx-auto max-w-4xl p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attempt history</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Review your completed assessments, scores, and answer keys.
                </p>
            </div>

            {history.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center bg-card">
                    <p className="text-muted-foreground text-sm">You have not attempted any tests yet.</p>
                    <Button variant="outline" className="mt-4" nativeButton={false} render={<Link href="/student/tests" />}>
                        View available tests
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {history.map((a) => {
                        const isSubmitted = a.status === "submitted";
                        const isInProgress = a.status === "in_progress";
                        const isExpired = a.status === "expired";

                        return (
                            <Link key={a.id} href={`/student/attempts/${a.id}`} className="group block">
                                <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 h-full">
                                    {/* Accent stripe */}
                                    <div
                                        className={`absolute inset-y-0 left-0 w-1 rounded-l-xl ${
                                            isExpired
                                                ? "bg-muted-foreground/30"
                                                : isSubmitted
                                                ? "bg-green-500"
                                                : isInProgress
                                                ? "bg-amber-500"
                                                : "bg-primary"
                                        }`}
                                    />

                                    <CardHeader className="pl-5 pb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
                                                {a.series_name}
                                            </CardTitle>
                                            {isInProgress && (
                                                <Badge variant="secondary" className="shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                    In progress
                                                </Badge>
                                            )}
                                            {isSubmitted && (
                                                <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    Completed
                                                </Badge>
                                            )}
                                            {isExpired && (
                                                <Badge variant="outline" className="shrink-0 text-muted-foreground">
                                                    Expired
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-xs">
                                            Attempt #{a.id}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="pl-5 text-xs text-muted-foreground space-y-2">
                                        <div className="space-y-0.5">
                                            <p>Started: {new Date(a.started_at).toLocaleString()}</p>
                                            {a.submitted_at && (
                                                <p>Submitted: {new Date(a.submitted_at).toLocaleString()}</p>
                                            )}
                                        </div>
                                        <div className="border-t pt-2 flex items-center justify-between">
                                            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                                                Test Score:
                                            </span>
                                            <span className="text-sm font-bold text-foreground">
                                                {a.score} <span className="text-muted-foreground text-xs font-normal">/ {a.total_marks}</span>
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
