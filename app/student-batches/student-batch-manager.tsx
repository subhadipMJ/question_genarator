"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, GraduationCap, ChevronRight, User as UserIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StudentBatch } from "../services/student-batches";
import type { User } from "../services/users";

type StudentBatchManagerProps = {
  initialBatches: StudentBatch[];
  users: User[];
};

export default function StudentBatchManager({ initialBatches, users }: StudentBatchManagerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [batches, setBatches] = useState<StudentBatch[]>(initialBatches);

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return batches;
    const q = searchQuery.toLowerCase();
    return batches.filter((b) => b.name.toLowerCase().includes(q));
  }, [batches, searchQuery]);

  // Helper to get supervisor name
  const getSupervisorName = (supervisorId: number) => {
    const user = users.find((u) => u.id === supervisorId);
    return user ? user.name : `Unknown (ID: ${supervisorId})`;
  };

  const handleCreateBatch = () => {
    router.push("/student-batches/create");
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.map((batch) => (
            <Link key={batch.id} href={`/student-batches/${batch.id}`} className="block group">
              <Card className="p-5 h-full transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                      {batch.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <UserIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{getSupervisorName(batch.supervisor)}</span>
                    </div>
                  </div>
                  <Badge variant={batch.is_active ? "default" : "secondary"} className="ml-2">
                    {batch.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="mt-auto pt-4 flex items-center justify-between text-sm border-t text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>ID: {batch.id}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

