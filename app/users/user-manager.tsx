"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { User } from "../services/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, UserPlus, GraduationCap, School, Mail, KeyRound, User as UserIcon, X, Loader2 } from "lucide-react";

interface UserManagerProps {
    initialUsers: User[];
    organizationId: number;
}

export default function UserManager({ initialUsers, organizationId }: UserManagerProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"student" | "teacher">("student");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Add User form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<2 | 3>(3); // 2 = Teacher, 3 = Student
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter users based on query and selected role
    const filteredUsers = users.filter((u) => {
        const matchesTab = activeTab === "student" ? u.role === 3 : u.role === 2;
        const matchesQuery = 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesQuery;
    });

    const studentsCount = users.filter((u) => u.role === 3).length;
    const teachersCount = users.filter((u) => u.role === 2).length;

    async function handleAddUser(e: React.FormEvent) {
        e.preventDefault();
        
        if (!name.trim() || !email.trim() || password.length < 8) {
            toast.error("Please fill in all fields correctly. Password must be at least 8 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/backend/organizations/${organizationId}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password: password,
                    role: role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail ?? "Failed to create user");
            }

            setUsers((prev) => [...prev, data]);
            
            // Success reset
            toast.success(`${role === 2 ? "Teacher" : "Student"} created successfully.`);
            setIsAddModalOpen(false);
            setName("");
            setEmail("");
            setPassword("");
            setRole(3); // Reset to default Student
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name or email..."
                        className="pl-9 h-10 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button 
                    onClick={() => setIsAddModalOpen(true)} 
                    className="flex items-center gap-2 h-10 shrink-0 cursor-pointer"
                >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Member</span>
                </Button>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <div className="flex space-x-6">
                    <button
                        onClick={() => setActiveTab("student")}
                        className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                            activeTab === "student"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <GraduationCap className="h-4 w-4" />
                        <span>Students</span>
                        <Badge variant={activeTab === "student" ? "default" : "secondary"} className="ml-1 px-1.5 py-0">
                            {studentsCount}
                        </Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab("teacher")}
                        className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                            activeTab === "teacher"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <School className="h-4 w-4" />
                        <span>Teachers</span>
                        <Badge variant={activeTab === "teacher" ? "default" : "secondary"} className="ml-1 px-1.5 py-0">
                            {teachersCount}
                        </Badge>
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <Card className="overflow-hidden border border-border">
                <CardContent className="p-0">
                    {filteredUsers.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                            <p className="text-lg font-medium">No members found</p>
                            <p className="text-sm mt-1">Try refining your search or add a new user to this organization.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="pl-6">Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="pr-6 text-right">Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="group transition-colors duration-150">
                                            <TableCell className="pl-6 font-semibold flex items-center gap-2.5 py-3">
                                                <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground font-bold flex items-center justify-center text-xs shrink-0 select-none">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="truncate max-w-[200px]">{user.name}</span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 2 ? "default" : "secondary"}>
                                                    {user.role === 2 ? "Teacher" : "Student"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="pr-6 text-right text-muted-foreground text-xs">
                                                {new Intl.DateTimeFormat("en", {
                                                    dateStyle: "medium",
                                                }).format(new Date(user.created_at))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modern Glassmorphic Modal Dialog */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 overflow-hidden relative animate-in fade-in-50 zoom-in-95 duration-200">
                        {/* Close button */}
                        <button 
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer rounded-full p-1 hover:bg-accent transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Add Member</h3>
                                <p className="text-xs text-muted-foreground">Register and add a user to this organization</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setRole(3)}
                                        className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                            role === 3 
                                                ? "bg-background text-foreground shadow-xs" 
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole(2)}
                                        className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                            role === 2 
                                                ? "bg-background text-foreground shadow-xs" 
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Teacher
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        required
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-9 h-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="johndoe@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-9 h-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password">Temporary Password</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        minLength={8}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-9 h-10"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Password must be at least 8 characters long</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddModalOpen(false)}
                                    disabled={isSubmitting}
                                    className="cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting || !name.trim() || !email.trim() || password.length < 8}
                                    className="cursor-pointer flex items-center gap-1.5"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Adding...</span>
                                        </>
                                    ) : (
                                        <span>Add Member</span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
