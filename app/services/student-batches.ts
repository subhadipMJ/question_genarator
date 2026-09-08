import { createApiClient } from "../lib/api-client";

export type StudentBatch = {
    id: number;
    org_id: number;
    name: string;
    supervisor: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

export async function getStudentBatches(): Promise<StudentBatch[]> {
    const client = await createApiClient();
    return client.get<StudentBatch[]>("student-batches/");
}

export async function getStudentBatch(batchId: number): Promise<StudentBatch> {
    const client = await createApiClient();
    return client.get<StudentBatch>(`student-batches/${batchId}`);
}

export type BatchStudent = {
    id: number;
    student_id: number;
    name: string | null;
    email: string | null;
};

export async function getBatchStudents(batchId: number): Promise<BatchStudent[]> {
    const client = await createApiClient();
    return client.get<BatchStudent[]>(`student-batches/${batchId}/students`);
}
