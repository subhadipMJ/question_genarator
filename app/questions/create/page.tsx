import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import QuestionForm from "./question-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CreateQuestionPage() {
    if (!(await cookies()).has("access_token")) redirect("/login");

    return (
        <main className="mx-auto w-full max-w-3xl p-6">
            <Button variant="ghost" nativeButton={false} render={<Link href="/questions" />}>← Back to questions</Button>
            <Card className="mt-4">
                <CardHeader><CardTitle className="text-3xl">Create question</CardTitle></CardHeader>
                <CardContent><QuestionForm /></CardContent>
            </Card>
        </main>
    );
}
