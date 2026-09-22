"use client";

import { useState, FormEvent } from "react";
import { toast } from "sonner";
import { UserPlus, Mail, KeyRound, User as UserIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/app/services/users";

export type AddStudentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onStudentAdded: (student: User) => void;
    organizationId: number;
};

export default function AddStudentModal({ isOpen, onClose, onStudentAdded, organizationId }: AddStudentModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    async function handleAddStudent(e: FormEvent) {
        e.preventDefault();
        if (!name.trim() || !email.trim() || password.length < 8) {
            toast.error("Please fill in all fields correctly. Password must be at least 8 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/backend/organizations/${organizationId}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    role: 3, // 3 = Student
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail ?? "Failed to create student");
            }

            toast.success("Student created successfully.");
            onStudentAdded(data);
            onClose();
            setName("");
            setEmail("");
            setPassword("");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 overflow-hidden relative animate-in fade-in-50 zoom-in-95 duration-200">
                <button 
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer rounded-full p-1 hover:bg-accent transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2.5 mb-5">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Add Student</h3>
                        <p className="text-xs text-muted-foreground">Register and add a new student to this organization</p>
                    </div>
                </div>

                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="new-student-name">Full Name</Label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="new-student-name"
                                required
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-9 h-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="new-student-email">Email address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="new-student-email"
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
                        <Label htmlFor="new-student-password">Temporary Password</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="new-student-password"
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
                            onClick={onClose}
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
                                <span>Add Student</span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
