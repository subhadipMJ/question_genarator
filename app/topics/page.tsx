import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllTopics } from "../services/topics";
import TopicManager from "./topic-manager";

export default async function TopicsPage() {
    const cookieStore = await cookies();
    if (!cookieStore.has("access_token")) redirect("/login");
    
    const role = cookieStore.get("user_role")?.value ?? "";
    if (role === "3") redirect("/student/tests");

    const allTopics = await getAllTopics();
    const topics = role === "0"
        ? allTopics.filter((topic) => topic.org_id === 0)
        : allTopics;

    return <TopicManager initialTopics={topics} userRole={role} />;
}
