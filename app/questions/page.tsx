import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { getAllQuestions } from "../services/questions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function QuestionsPage() {
    if (!(await cookies()).has("access_token")) redirect("/login");

    const questions = await getAllQuestions();

    return (
        <main className="p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">All questions</h1>
                <Button nativeButton={false} render={<Link href="/questions/create" />}>Create question</Button>
            </div>

            <div className="space-y-3">
                {questions.map((item) => (
                    <Card key={item.id} className="transition-colors hover:bg-accent/50">
                      <Link href={`/questions/${item.id}`}>
                        <CardHeader className="flex-row items-start justify-between gap-4">
                          <CardTitle
                            className="text-base leading-relaxed"
                            dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(item.question ?? item.title ?? "", {
                                    allowedTags: [
                                        ...sanitizeHtml.defaults.allowedTags,
                                        "sub",
                                        "sup",
                                    ],
                                }),
                            }}
                          />
                          <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge>
                        </CardHeader>

                        {(item.options?.length ?? 0) > 0 && (
                          <CardContent>
                            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                                {item.options?.map((option) => (
                                    <li key={option.id}>{option.ans}</li>
                                ))}
                            </ul>
                          </CardContent>
                        )}
                      </Link>
                    </Card>
                ))}
            </div>
        </main>
    );
}
