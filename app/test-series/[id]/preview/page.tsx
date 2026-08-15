import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PreviewRunner from "./preview-runner";
import { getTestSeriesQuestions } from "../../../services/student";

type PreviewPageProps = {
    params: Promise<{ id: string }>;
};

export default async function PreviewPage(props: PreviewPageProps) {
    const cookieStore = await cookies();
    if (!cookieStore.has("access_token")) redirect("/login");
    const role = cookieStore.get("user_role")?.value;
    if (!role || !["0", "1", "2"].includes(role)) redirect("/student/tests");

    const { id } = await props.params;

    try {
        const previewData = await getTestSeriesQuestions<any>(id);
        return (
            <main className="p-6">
                <PreviewRunner initialData={previewData} />
            </main>
        );
    } catch (err: unknown) {
        const errorMessage = err instanceof Error && err.message !== "AUTH_REQUIRED"
            ? err.message
            : "Test series not found or access denied.";

        return (
            <main className="p-6 max-w-xl mx-auto py-16">
                <Card className="text-center p-8 border-destructive/30 bg-destructive/5 shadow-md">
                    <CardHeader className="p-0 mb-4">
                        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                        <CardTitle className="text-xl mt-3 text-destructive">Preview Error</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                        <p className="text-sm text-muted-foreground">{errorMessage}</p>
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
}
