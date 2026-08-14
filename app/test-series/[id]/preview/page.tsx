import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiUrl } from "../../../lib/api-url";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PreviewRunner from "./preview-runner";

type PreviewPageProps = {
    params: Promise<{ id: string }>;
};

export default async function PreviewPage(props: PreviewPageProps) {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const role = cookieStore.get("user_role")?.value;

    if (!token) redirect("/login");
    // Restrict preview to admins and teachers
    if (!role || !["0", "1", "2"].includes(role)) redirect("/student/tests");

    const params = await props.params;
    const { id } = params;

    // Fetch from backend endpoint: GET /test-series/{series_id}/questions
    const response = await fetch(getApiUrl(`test-series/${id}/questions`), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = typeof errorData?.detail === "string" ? errorData.detail : "Test series not found or access denied.";
        return (
            <main className="p-6 max-w-xl mx-auto py-16">
                <Card className="text-center p-8 border-destructive/30 bg-destructive/5 shadow-md">
                    <CardHeader className="p-0 mb-4">
                        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                        <CardTitle className="text-xl mt-3 text-destructive">Preview Error</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {errorMessage}
                        </p>
                        <div className="pt-2 flex justify-center gap-3">
                            <Button nativeButton={false} render={<Link href={`/test-series/${id}`} />}>
                                Return to Editor
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        );
    }

    const previewData = await response.json();

    return (
        <main className="p-6">
            <PreviewRunner initialData={previewData} />
        </main>
    );
}
