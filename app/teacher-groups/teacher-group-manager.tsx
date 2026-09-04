"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { TeacherGroup } from "../services/teacher-groups";

type TeacherGroupManagerProps = {
  initialGroups: TeacherGroup[];
  userRole: string;
};

export default function TeacherGroupManager({
  initialGroups,
}: TeacherGroupManagerProps) {
  const [groups, setGroups] = useState<TeacherGroup[]>(initialGroups);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleDelete(groupId: number) {
    if (
      !confirm(
        "Are you sure you want to soft delete this teacher group? It can be restored if needed."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/backend/teacher-groups/${groupId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Failed to delete teacher group.");
      }
      setGroups((current) => current.filter((g) => g.id !== groupId));
      toast.success("Teacher group soft deleted successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete teacher group.");
    }
  }

  const filteredGroups = groups.filter((g) => {
    const q = searchQuery.toLowerCase();
    const groupNameMatch = g.name.toLowerCase().includes(q);
    const supervisorMatch = g.supervisor_user?.name.toLowerCase().includes(q);
    return groupNameMatch || supervisorMatch;
  });

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Teacher Groups
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organize teachers into department groups with assigned supervisors.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/teacher-groups/create" />}
          className="flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Teacher Group
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search groups or supervisors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Group Cards Grid */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-16 border rounded-xl border-dashed bg-card/50">
          <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-lg font-semibold">No Teacher Groups Found</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            {searchQuery
              ? "No teacher groups match your search filter."
              : "Get started by creating your first teacher group."}
          </p>
          {!searchQuery && (
            <Button nativeButton={false} render={<Link href="/teacher-groups/create" />} variant="outline">
              Create Group Now
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Card
              key={group.id}
              className="relative overflow-hidden transition-all duration-200 hover:shadow-lg border-border/80 flex flex-col justify-between"
            >
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl font-bold text-foreground truncate">
                      {group.name}
                    </CardTitle>
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${
                        group.is_active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                      }`}
                    >
                      {group.is_active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> Inactive
                        </>
                      )}
                    </span>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    ID: #{group.id} • Created {new Date(group.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Supervisor */}
                  <div className="rounded-lg bg-muted/40 p-3 border border-border/50">
                    <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider block mb-1">
                      Supervisor
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {group.supervisor_user?.name ?? `User #${group.supervisor}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {group.supervisor_user?.email ?? ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Teachers */}
                  <div>
                    <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider block mb-2">
                      Assigned Teachers ({group.teachers.length})
                    </span>
                    {group.teachers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No teachers assigned yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {group.teachers.map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-medium"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 pt-0 border-t border-border/40 mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/teacher-groups/${group.id}`} />}
                  className="flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(group.id)}
                  className="text-destructive hover:bg-destructive/10 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
