import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllTeacherGroups } from "../services/teacher-groups";
import TeacherGroupManager from "./teacher-group-manager";

export default async function TeacherGroupsPage() {
  const cookieStore = await cookies();
  if (!cookieStore.has("access_token")) redirect("/login");

  const role = cookieStore.get("user_role")?.value ?? "";
  if (role === "3") redirect("/student/tests");

  let initialGroups: Awaited<ReturnType<typeof getAllTeacherGroups>> = [];

  try {
    initialGroups = await getAllTeacherGroups();
  } catch (err) {
    console.error("Failed to load initial teacher groups data:", err);
  }

  return (
    <TeacherGroupManager
      initialGroups={initialGroups}
      userRole={role}
    />
  );
}
