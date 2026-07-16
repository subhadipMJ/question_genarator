"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Organization } from "../services/organizations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function OrganizationManager({ initialOrganizations }: { initialOrganizations: Organization[] }) {
    const [organizations, setOrganizations] = useState(initialOrganizations);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [pendingId, setPendingId] = useState<number | null>(null);

    async function updateOrganization(id: number, body: { name?: string; is_active?: boolean }) {
        setPendingId(id);
        try {
            const response = await fetch(`/api/organizations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const result = await response.json().catch(() => null) as Organization & { message?: string };
            if (!response.ok) throw new Error(result?.message ?? "Unable to update organization.");

            setOrganizations((current) => current.map((organization) =>
                organization.id === id ? result : organization,
            ));
            setEditingId(null);
            toast.success(body.name ? "Organization updated." : `Organization ${body.is_active ? "activated" : "deactivated"}.`);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Unable to update organization.");
        } finally {
            setPendingId(null);
        }
    }

    if (organizations.length === 0) {
        return <p className="text-muted-foreground px-6 py-10 text-center">No organizations found.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                    {organizations.map((organization) => (
                        <TableRow key={organization.id}>
                            <TableCell className="font-medium">
                                {editingId === organization.id ? (
                                    <Input value={name} onChange={(event) => setName(event.target.value)} className="max-w-sm" autoFocus />
                                ) : organization.name}
                            </TableCell>
                            <TableCell><Badge variant={organization.is_active ? "default" : "secondary"}>{organization.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                            <TableCell>
                                <div className="flex justify-end gap-2">
                                    {editingId === organization.id ? (
                                        <>
                                            <Button size="sm" disabled={!name.trim() || pendingId === organization.id} onClick={() => updateOrganization(organization.id, { name: name.trim() })}>Save</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                        </>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => { setEditingId(organization.id); setName(organization.name); }}>Edit</Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant={organization.is_active ? "destructive" : "outline"}
                                        disabled={pendingId === organization.id}
                                        onClick={() => updateOrganization(organization.id, { is_active: !organization.is_active })}
                                    >
                                        {organization.is_active ? "Deactivate" : "Activate"}
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
