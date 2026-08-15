import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AttemptRunner, { type Attempt } from "./attempt-runner";
import { getStudentAttempt } from "../../../services/student";

export default async function Page({ params, searchParams }: PageProps<"/student/attempts/[id]">) {
    const cookieStore = await cookies();
    if (!cookieStore.has("access_token")) redirect("/login");
    const role = cookieStore.get("user_role")?.value;
    if (!role || !["0", "1", "2", "3"].includes(role)) redirect("/dashboard");

    const { id } = await params;
    const query = await searchParams;

    try {
        const attempt = await getStudentAttempt<Attempt>(id);
        return (
            <main className="p-6">
                <AttemptRunner
                    initialAttempt={attempt}
                    readOnly={role !== "3"}
                    skipInstructions={query.started === "1"}
                />
            </main>
        );
    } catch (err: unknown) {
        const errorMessage = err instanceof Error && err.message !== "AUTH_REQUIRED"
            ? err.message
            : "Attempt not found or access denied.";

        return (
            <main className="p-6 max-w-xl mx-auto py-16">
                <Card className="text-center p-8 border-destructive/30 bg-destructive/5 shadow-md">
                    <CardHeader className="p-0 mb-4">
                        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                        <CardTitle className="text-xl mt-3 text-destructive">Attempt Not Found</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                        <p className="text-sm text-muted-foreground">{errorMessage}</p>
                        <p className="text-xs text-muted-foreground">
                            Note: Test Series IDs (e.g. /test-series/21) are different from individual Student Attempt IDs.
                        </p>
                        <div className="pt-2 flex justify-center gap-3">
                            <Button nativeButton={false} render={<Link href={role === "3" ? "/student/tests" : "/test-series"} />}>
                                Return to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        );
    }
}
