import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ResetPasswordForm from "./reset-password-form";

export const metadata = {
  title: "Reset Password | QMaster",
  description: "Reset your QMaster account password.",
};

export default async function ResetPasswordPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <main className="mx-auto mt-8 max-w-md px-4 sm:px-6">
      <Card className="shadow-lg border border-border/60">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
          <CardDescription>
            Update your account password below to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
