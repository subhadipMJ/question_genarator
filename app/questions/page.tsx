import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { getOrganization } from "../services/organizations";
import { getAllQuestions } from "../services/questions";
import { getUser } from "../services/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function QuestionsPage() {
    const cookieStore = await cookies();
    if (!cookieStore.has("access_token")) redirect("/login");
    if (cookieStore.get("user_role")?.value === "3") redirect("/student/tests");

    const questions = await getAllQuestions();
    const nonGlobalQuestions = questions.filter((question) => !question.is_global);
    const userIds = [...new Set(nonGlobalQuestions.map((question) => question.user_id))];
    const organizationIds = [...new Set(nonGlobalQuestions.map((question) => question.organization_id))];
    const [userResults, organizationResults] = await Promise.all([
        Promise.allSettled(userIds.map((id) => getUser(id))),
        Promise.allSettled(organizationIds.map((id) => getOrganization(id))),
    ]);
    const users = new Map(userResults.flatMap((result) =>
        result.status === "fulfilled" ? [[result.value.id, result.value.name] as const] : [],
    ));
    const organizations = new Map(organizationResults.flatMap((result) =>
        result.status === "fulfilled" ? [[result.value.id, result.value.name] as const] : [],
    ));

    return (
        <main className="p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">All questions</h1>
                <div className="flex gap-2">
                    <Button variant="outline" nativeButton={false} render={<Link href="/questions/bulk" />}>Bulk upload</Button>
                    <Button nativeButton={false} render={<Link href="/questions/create" />}>Create question</Button>
                </div>
            </div>

            <div className="gap-3 grid grid-cols-1 md:grid-cols-2">
                {questions.map((item) => (
                    <Card key={item.id} className="transition-colors hover:bg-accent/50 ">
                      <Link href={`/questions/${item.id}`}>
                        <CardHeader className="flex items-center justify-between mb-2">
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
                          <div className="flex shrink-0 gap-2">
                            <Badge variant="outline">{item.marks} marks</Badge>
                            <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge>
                          </div>
                        </CardHeader>

                        {((item.options?.length ?? 0) > 0 || !item.is_global) && (
                          <CardContent>
                            {(item.options?.length ?? 0) > 0 && (
                                <ol className="text-muted-foreground grid list-inside list-[upper-alpha] grid-cols-3 space-y-1 text-sm">
                                    {item.options?.map((option) => (
                                        <li key={option.id} className={option.is_correct ? "text-green-700" : ""}>{option.ans}</li>
                                    ))}
                                </ol>
                            )}
                            {!item.is_global && (
                                <dl className="text-muted-foreground mt-3 grid gap-1 border-t pt-3 text-xs sm:grid-cols-2">
                                    <div><dt className="inline font-medium">Creator: </dt><dd className="inline">{users.get(item.user_id) ?? `User #${item.user_id}`}</dd></div>
                                    <div><dt className="inline font-medium">Organization: </dt><dd className="inline">{organizations.get(item.organization_id) ?? `Organization #${item.organization_id}`}</dd></div>
                                </dl>
                            )}
                          </CardContent>
                        )}
                      </Link>
                    </Card>
                ))}
            </div>
        </main>
    );
}
