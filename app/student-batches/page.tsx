import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import StudentBatchManager from "./student-batch-manager";
import { getStudentBatches, type StudentBatch } from "../services/student-batches";
import { getOrganizationUsers } from "../services/organizations";
import type { User } from "../services/users";

export default async function StudentBatchesPage() {
  const cookieStore = await cookies();
  if (!cookieStore.has("access_token")) redirect("/login");

  const role = cookieStore.get("user_role")?.value ?? "";
  if (role === "3") redirect("/student/tests");

  const organizationId = cookieStore.get("organization_id")?.value ?? "";

  let batches: StudentBatch[] = [];
  let users: User[] = [];

  try {
    batches = await getStudentBatches();
    if (organizationId) {
      users = await getOrganizationUsers(Number(organizationId));
    }
  } catch (error) {
    console.error("Failed to fetch student batches or users:", error);
  }

  return <StudentBatchManager initialBatches={batches} users={users} />;
}

