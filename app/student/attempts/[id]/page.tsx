import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiUrl } from "../../../lib/api-url";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AttemptRunner, { type Attempt } from "./attempt-runner";

export default async function Page({ params }: PageProps<"/student/attempts/[id]">) {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const role = cookieStore.get("user_role")?.value;

    if (!token) redirect("/login");
    if (!role || !["0", "1", "2", "3"].includes(role)) redirect("/dashboard");

    const { id } = await params;
    const response = await fetch(getApiUrl(`student/attempts/${id}`), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = typeof errorData?.detail === "string" ? errorData.detail : "Attempt not found or access denied.";
        return (
            <main className="p-6 max-w-xl mx-auto py-16">
                <Card className="text-center p-8 border-destructive/30 bg-destructive/5 shadow-md">
                    <CardHeader className="p-0 mb-4">
                        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                        <CardTitle className="text-xl mt-3 text-destructive">Attempt Not Found</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {errorMessage}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Note: Test Series IDs (e.g. /test-series/21) are different from individual Student Attempt IDs. Ensure you are accessing results from the Test Series page.
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

    return (
        <main className="p-6">
            <AttemptRunner
                initialAttempt={await response.json() as Attempt}
                readOnly={role !== "3"}
            />
        </main>
    );
}
