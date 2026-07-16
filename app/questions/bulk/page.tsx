import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BulkUploader from "./bulk-uploader";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Bulk Upload Questions | QMaster",
    description: "Upload multiple questions at once using JSON or the interactive builder.",
};

export default async function BulkUploadPage() {
    const cookieStore = await cookies();
    if (!cookieStore.has("access_token")) redirect("/login");
    const role = cookieStore.get("user_role")?.value;
    if (!role || !["0", "1", "2"].includes(role)) redirect("/student/tests");

    return (
        <main className="mx-auto w-full max-w-4xl p-6">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" nativeButton={false} render={<Link href="/questions" />}>
                    ← Back to questions
                </Button>
            </div>
            <BulkUploader />
        </main>
    );
}
