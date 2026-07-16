import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getQuestion } from "../../services/questions";
import QuestionEditor from "./question-editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QuestionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: QuestionPageProps) {
  if (!(await cookies()).has("access_token")) redirect("/login");

  const { id } = await params;
  const questionId = Number(id);

  if (!Number.isInteger(questionId) || questionId < 1) {
    return <Alert variant="destructive"><AlertDescription>Invalid question ID.</AlertDescription></Alert>;
  }

  const question = await getQuestion(questionId);

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Button variant="ghost" nativeButton={false} render={<Link href="/questions" />}>← Back to questions</Button>
      <Card className="mt-4">
        <CardHeader><CardTitle className="text-3xl">Edit question</CardTitle></CardHeader>
        <CardContent><QuestionEditor question={question} /></CardContent>
      </Card>
    </main>
  );
}
