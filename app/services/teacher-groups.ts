import { createApiClient } from "../lib/api-client";

export type TeacherUserSummary = {
  id: number;
  name: string;
  email: string;
  role: number;
};

export type TeacherGroup = {
  id: number;
  org_id: number;
  created_by: number;
  name: string;
  supervisor: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  creator: TeacherUserSummary | null;
  supervisor_user: TeacherUserSummary | null;
  teachers: TeacherUserSummary[];
};

export type CreateTeacherGroupInput = {
  name: string;
  supervisor: number;
  org_id?: number;
  teacher_ids: number[];
  is_active?: boolean;
};

export type UpdateTeacherGroupInput = Partial<CreateTeacherGroupInput>;

export async function getAllTeacherGroups(): Promise<TeacherGroup[]> {
  const client = await createApiClient();
  return client.get<TeacherGroup[]>("teacher-groups");
}

export async function getTeacherGroup(groupId: number): Promise<TeacherGroup> {
  const client = await createApiClient();
  return client.get<TeacherGroup>(`teacher-groups/${groupId}`);
}

export async function createTeacherGroup(
  data: CreateTeacherGroupInput
): Promise<TeacherGroup> {
  const client = await createApiClient();
  return client.post<TeacherGroup>("teacher-groups", data);
}

export async function updateTeacherGroup(
  groupId: number,
  data: UpdateTeacherGroupInput
): Promise<TeacherGroup> {
  const client = await createApiClient();
  return client.put<TeacherGroup>(`teacher-groups/${groupId}`, data);
}

export async function deleteTeacherGroup(
  groupId: number
): Promise<{ detail: string }> {
  const client = await createApiClient();
  return client.delete<{ detail: string }>(`teacher-groups/${groupId}`);
}
