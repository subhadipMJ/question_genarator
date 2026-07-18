import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOrganization } from "../services/organizations";
import { getAllQuestionsList } from "../services/questions";
import { getAllTopics } from "../services/topics";
import { getUser } from "../services/users";
import { Button } from "@/components/ui/button";
import QuestionsTable from "./questions-table";

export default async function QuestionsPage() {
    const cookieStore = await cookies();
    if (!cookieStore.has("access_token")) redirect("/login");
    if (cookieStore.get("user_role")?.value === "3") redirect("/student/tests");

    const [questions, topics] = await Promise.all([
        getAllQuestionsList(),
        getAllTopics().catch(() => []),
    ]);

    const nonGlobalQuestions = questions.filter((question) => !question.is_global);
    const userIds = [...new Set(nonGlobalQuestions.map((question) => question.user_id))];
    const organizationIds = [...new Set(nonGlobalQuestions.map((question) => question.organization_id))];
    const [userResults, organizationResults] = await Promise.all([
        Promise.allSettled(userIds.map((id) => getUser(id))),
        Promise.allSettled(organizationIds.map((id) => getOrganization(id))),
    ]);

    const users = Object.fromEntries(
        userResults.flatMap((result) =>
            result.status === "fulfilled" ? [[result.value.id, result.value.name]] : [],
        )
    );

    const organizations = Object.fromEntries(
        organizationResults.flatMap((result) =>
            result.status === "fulfilled" ? [[result.value.id, result.value.name]] : [],
        )
    );

    return (
        <main className="p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">All questions</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        View, search, and manage questions in your database.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" nativeButton={false} render={<Link href="/questions/bulk" />}>
                        Bulk upload
                    </Button>
                    <Button nativeButton={false} render={<Link href="/questions/create" />}>
                        Create question
                    </Button>
                </div>
            </div>

            <QuestionsTable
                initialQuestions={questions}
                topics={topics}
                users={users}
                organizations={organizations}
            />
        </main>
    );
}
