import { createApiClient } from "../lib/api-client";

export type User = {
    id: number;
    role: number;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
};

export async function getAllUsers(): Promise<User[]> {
    const client = await createApiClient();
    return client.get<User[]>("users/");
}

export async function getUser(userId: number): Promise<User> {
    const client = await createApiClient();
    return client.get<User>(`users/${userId}`);
}

export type StudentHistoryResponse = {
    student_id: number;
    student_name: string;
    student_email: string;
    total_tests: number;
    history: Array<{
        attempt_id: number;
        series_id: number;
        series_name: string;
        series_code: string;
        score: number;
        total_marks: number;
        percentage: number;
        status: string;
        started_at: string;
        submitted_at: string | null;
    }>;
};

export async function getStudentHistory(studentId: number): Promise<StudentHistoryResponse> {
    const client = await createApiClient();
    return client.get<StudentHistoryResponse>(`student/${studentId}/history`);
}
