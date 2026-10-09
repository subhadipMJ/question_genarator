"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FolderPlus,
    Search,
    BookOpen,
    Globe,
    Building2,
    Copy,
    Trash2,
    ExternalLink,
    Plus,
    X,
    Loader2,
    Layers,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import type { QuestionSetItem } from "../services/question-sets";

export interface QuestionSetsManagerProps {
    initialSets: QuestionSetItem[];
    userRole: string;
}

export default function QuestionSetsManager({ initialSets, userRole }: QuestionSetsManagerProps) {
    const router = useRouter();
    const [sets, setSets] = useState<QuestionSetItem[]>(initialSets);
    const [searchQuery, setSearchQuery] = useState("");
    const [visibilityFilter, setVisibilityFilter] = useState<"all" | "org" | "public">("all");
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "questions_desc" | "questions_asc" | "name_asc">("newest");

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSetName, setNewSetName] = useState("");
    const [newSetVisibility, setNewSetVisibility] = useState<number>(0); // 0 = Org only, 1 = Public
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionId, setActionId] = useState<number | null>(null);

    // Filter sets
    const filteredSets = useMemo(() => {
        let result = sets.filter((s) => {
            if (visibilityFilter === "org" && s.visibility !== 0) return false;
            if (visibilityFilter === "public" && s.visibility !== 1) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                if (!s.name.toLowerCase().includes(q)) return false;
            }

            return true;
        });

        return result.sort((a, b) => {
            if (sortOrder === "newest") return b.id - a.id;
            if (sortOrder === "oldest") return a.id - b.id;
            if (sortOrder === "questions_desc") return (b.question_count || 0) - (a.question_count || 0);
            if (sortOrder === "questions_asc") return (a.question_count || 0) - (b.question_count || 0);
            if (sortOrder === "name_asc") return a.name.localeCompare(b.name);
            return 0;
        });
    }, [sets, visibilityFilter, searchQuery, sortOrder]);

    const stats = useMemo(() => {
        const total = sets.length;
        const orgSets = sets.filter((s) => s.visibility === 0).length;
        const publicSets = sets.filter((s) => s.visibility === 1).length;
        const totalQuestions = sets.reduce((acc, s) => acc + (s.question_count || 0), 0);
        return { total, orgSets, publicSets, totalQuestions };
    }, [sets]);

    const handleCreateSet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSetName.trim()) {
            toast.error("Please enter a question set name");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/backend/question-sets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newSetName.trim(),
                    visibility: newSetVisibility,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to create question set");
            }
            const created = (await res.json()) as QuestionSetItem;
            setSets((prev) => [created, ...prev]);
            toast.success(`Question set '${created.name}' created!`);
            setIsCreateModalOpen(false);
            setNewSetName("");
            setNewSetVisibility(0);
            router.push(`/question-sets/${created.id}`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to create question set");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopySet = async (id: number) => {
        setActionId(id);
        try {
            const res = await fetch(`/api/backend/question-sets/${id}/copy`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to copy question set");
            }
            const copied = (await res.json()) as QuestionSetItem;
            setSets((prev) => [copied, ...prev]);
            toast.success(`Copied question set '${copied.name}'`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to copy question set");
        } finally {
            setActionId(null);
        }
    };

    const handleDeleteSet = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete question set '${name}'?`)) return;
        setActionId(id);
        try {
            const res = await fetch(`/api/backend/question-sets/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to delete question set");
            }
            setSets((prev) => prev.filter((s) => s.id !== id));
            toast.success("Question set deleted");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to delete question set");
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs font-semibold gap-1">
                            <Layers className="h-3 w-3" />
                            Question Bank Sets
                        </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
                        Question Sets
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Curate question pools (e.g. Class 10 Math 5 Years Questions) and launch them as tests anytime.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="gap-1.5 shadow-xs cursor-pointer font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        Create Question Set
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Total Sets
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">Managed sets</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Total Questions
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Layers className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                        <p className="text-xs text-muted-foreground mt-1">Bundled across sets</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Organization Sets
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Building2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.orgSets}</div>
                        <p className="text-xs text-muted-foreground mt-1">Private to institute</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Public Sets
                        </CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Globe className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.publicSets}</div>
                        <p className="text-xs text-muted-foreground mt-1">Open platform sets</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search question set name (e.g. Math, Class 10)…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs"
                    />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-1 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setVisibilityFilter("all")}
                            className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                                visibilityFilter === "all"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            All Sets ({sets.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setVisibilityFilter("org")}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                                visibilityFilter === "org"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Building2 className="h-3 w-3 text-amber-500" />
                            Organization Only
                        </button>
                        <button
                            type="button"
                            onClick={() => setVisibilityFilter("public")}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                                visibilityFilter === "public"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Globe className="h-3 w-3 text-emerald-500" />
                            Public
                        </button>
                    </div>

                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0 cursor-pointer"
                    >
                        <option value="newest">Sort: Newest First</option>
                        <option value="oldest">Sort: Oldest First</option>
                        <option value="questions_desc">Sort: Most Questions</option>
                        <option value="questions_asc">Sort: Fewest Questions</option>
                        <option value="name_asc">Sort: Name (A-Z)</option>
                    </select>
                </div>
            </div>

            {/* Grid of Question Sets */}
            {filteredSets.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <FolderPlus className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No Question Sets Found</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                        {searchQuery
                            ? "No question sets match your search filter."
                            : "Create your first question set (e.g. 'Class 10 Math 5 Years Questions') to easily bundle and manage questions."}
                    </p>
                    <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="gap-1.5 text-xs">
                        <Plus className="h-4 w-4" />
                        Create Question Set
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSets.map((s) => (
                        <Card
                            key={s.id}
                            className="group hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between"
                        >
                            <CardHeader className="pb-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    {s.visibility === 1 ? (
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 gap-1 font-semibold"
                                        >
                                            <Globe className="h-3 w-3" />
                                            Public
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 gap-1 font-semibold"
                                        >
                                            <Building2 className="h-3 w-3" />
                                            Organization Only
                                        </Badge>
                                    )}

                                    <Badge variant="outline" className="font-mono text-[10px]">
                                        #{s.id}
                                    </Badge>
                                </div>

                                <CardTitle className="text-base font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                    <Link href={`/question-sets/${s.id}`}>{s.name}</Link>
                                </CardTitle>
                                <CardDescription className="text-xs flex items-center gap-1.5">
                                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>
                                        <strong>{s.question_count}</strong> question{s.question_count !== 1 ? "s" : ""} in this set
                                    </span>
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-2 border-t bg-muted/20 flex items-center justify-between gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1 font-medium cursor-pointer"
                                    nativeButton={false}
                                    render={<Link href={`/question-sets/${s.id}`} />}
                                >
                                    <span>Open & Manage</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                        onClick={() => handleCopySet(s.id)}
                                        disabled={actionId === s.id}
                                        title="Duplicate Set"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                                        onClick={() => handleDeleteSet(s.id, s.name)}
                                        disabled={actionId === s.id}
                                        title="Delete Set"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Question Set Modal */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-md rounded-2xl border bg-background shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/30">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <FolderPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-foreground">Create Question Set</h3>
                                    <p className="text-xs text-muted-foreground">Bundle questions into a reusable set</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleCreateSet} className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Question Set Name</label>
                                <Input
                                    placeholder="e.g. Class 10 Math 5 Years Questions"
                                    value={newSetName}
                                    onChange={(e) => setNewSetName(e.target.value)}
                                    required
                                    autoFocus
                                    className="text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground">Access & Visibility</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <label
                                        className={`flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-all ${
                                            newSetVisibility === 0
                                                ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 font-semibold"
                                                : "border-border hover:bg-muted/40"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-xs">
                                            <input
                                                type="radio"
                                                name="visibility"
                                                checked={newSetVisibility === 0}
                                                onChange={() => setNewSetVisibility(0)}
                                                className="accent-amber-500"
                                            />
                                            <Building2 className="h-3.5 w-3.5 text-amber-500" />
                                            <span>Organization</span>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground font-normal leading-tight">
                                            Private to your institute only
                                        </span>
                                    </label>

                                    <label
                                        className={`flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-all ${
                                            newSetVisibility === 1
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-semibold"
                                                : "border-border hover:bg-muted/40"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 text-xs">
                                            <input
                                                type="radio"
                                                name="visibility"
                                                checked={newSetVisibility === 1}
                                                onChange={() => setNewSetVisibility(1)}
                                                className="accent-emerald-500"
                                            />
                                            <Globe className="h-3.5 w-3.5 text-emerald-500" />
                                            <span>Public</span>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground font-normal leading-tight">
                                            Available to all across platform
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5 font-medium">
                                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Create & Open
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
