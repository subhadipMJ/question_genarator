"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, GraduationCap, User as UserIcon, Check, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StudentBatch, BatchStudent } from "../services/student-batches";
import type { User } from "../services/users";

type StudentBatchManagerProps = {
  initialBatches: StudentBatch[];
  users: User[];
  initialBatchStudents: Record<number, BatchStudent[]>;
};

export default function StudentBatchManager({ initialBatches, users, initialBatchStudents }: StudentBatchManagerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [batches, setBatches] = useState<StudentBatch[]>(initialBatches);

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return batches;
    const q = searchQuery.toLowerCase();
    return batches.filter((b) => b.name.toLowerCase().includes(q));
  }, [batches, searchQuery]);

  // Helper to get supervisor details
  const getSupervisor = (supervisorId: number) => {
    return users.find((u) => u.id === supervisorId) || { name: `Unknown (ID: ${supervisorId})`, email: "" };
  };

  const handleCreateBatch = () => {
    router.push("/student-batches/create");
  };

  const onEdit = (batchId: number) => {
    router.push(`/student-batches/${batchId}`);
  };

  const onDelete = async (batchId: number) => {
    if (confirm("Are you sure you want to delete this batch?")) {
      try {
        const res = await fetch(`/api/backend/student-batches/${batchId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete batch");
        
        setBatches((prev) => prev.filter((b) => b.id !== batchId));
        toast.success("Batch deleted successfully.");
      } catch (error) {
        console.error(error);
        toast.error("An error occurred while deleting the batch.");
      }
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            Student Batches
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organize and manage student batches and enrollments.
          </p>
        </div>
        <Button
          onClick={handleCreateBatch}
          className="flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Student Batch
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search batches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Empty State or List */}
      {filteredBatches.length === 0 ? (
        <div className="text-center py-16 border rounded-xl border-dashed bg-card/50">
          <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-lg font-semibold">No Student Batches Found</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            {searchQuery ? "No batches match your search." : "Get started by creating your first student batch."}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateBatch} variant="outline">
              Create Batch Now
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.map((batch) => {
            const supervisor = getSupervisor(batch.supervisor);
            const assignedStudents = initialBatchStudents[batch.id] || [];
            
            return (
              <Card key={batch.id} className="flex flex-col h-full border-gray-200 shadow-sm transition-all hover:shadow-md">
                <div className="p-5 flex-1 space-y-6">
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-xl truncate" title={batch.name}>
                        {batch.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        ID: #{batch.id} &bull; Created {formatDate(batch.created_at)}
                      </p>
                    </div>
                    {batch.is_active ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1 shrink-0 border-transparent shadow-none font-medium">
                        <Check className="w-3 h-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-amber-700 bg-amber-50 hover:bg-amber-100 shrink-0 font-medium border-transparent shadow-none">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  {/* Supervisor Section */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Supervisor
                    </h4>
                    <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 border border-border/50">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{supervisor.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {supervisor.email || "No email provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Students Section */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Assigned Students ({assignedStudents.length})
                    </h4>
                    {assignedStudents.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedStudents.slice(0, 5).map((student) => (
                          <Badge key={student.id} variant="secondary" className="rounded-full px-3 py-1 font-normal text-xs bg-muted hover:bg-muted">
                            {student.name || `Student #${student.student_id}`}
                          </Badge>
                        ))}
                        {assignedStudents.length > 5 && (
                          <Badge variant="outline" className="rounded-full px-3 py-1 font-normal text-xs border-dashed text-muted-foreground">
                            +{assignedStudents.length - 5} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic bg-muted/10 p-2 rounded-md border border-dashed text-center">
                        No students assigned
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer / Actions */}
                <div className="p-4 border-t bg-muted/5 flex items-center justify-end gap-2 mt-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(batch.id)}
                    className="h-8 shadow-sm font-medium bg-background"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDelete(batch.id)}
                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

