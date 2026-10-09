"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    ArrowLeft,
    Plus,
    Rocket,
    Globe,
    Building2,
    Trash2,
    Search,
    X,
    Loader2,
    Check,
    CheckCircle2,
    BookOpen,
    Edit2,
    Edit3,
    Sparkles,
    UploadCloud,
    Calendar,
    Filter,
    SlidersHorizontal,
    ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { sanitizeHtmlContent } from "@/lib/sanitize";
import AdvancedBulkUpload from "@/components/advanced-bulk-upload";
import { useTopics } from "@/lib/query/topics/use-topics";
import {
    type QuestionSetDetail,
    type QuestionInSet,
} from "../../services/question-sets";

const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => <div className="bg-muted h-32 animate-pulse rounded" />,
}) as unknown as typeof import("react-quill-new").default;

const QUILL_MODULES = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ script: "sub" }, { script: "super" }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "clean"],
    ],
};

const QUILL_FORMATS = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "script",
    "list",
    "link",
];

function formatQuestionDate(dateStr?: string): string {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return "";
    }
}

export interface QuestionSetEditorProps {
    initialSet: QuestionSetDetail;
    userRole: string;
}

export default function QuestionSetEditor({ initialSet, userRole }: QuestionSetEditorProps) {
    const router = useRouter();
    const [set, setSet] = useState<QuestionSetDetail>(initialSet);

    // Renaming state
    const [isEditingName, setIsEditingName] = useState(false);
    const [setName, setSetName] = useState(initialSet.name);

    const { data: topics = [] } = useTopics();

    // Edit Question Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<QuestionInSet | null>(null);
    const [editQText, setEditQText] = useState("");
    const [editQMarks, setEditQMarks] = useState("1");
    const [editQTopicId, setEditQTopicId] = useState("");
    const [editQOptions, setEditQOptions] = useState<Array<{ id?: number; ans: string; is_correct: boolean }>>([]);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Bulk upload modal state
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    // Add questions modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [bankSearch, setBankSearch] = useState("");
    const [bankTopicId, setBankTopicId] = useState<string>("");
    const [bankDateRange, setBankDateRange] = useState<"all" | "today" | "7days" | "30days" | "90days" | "custom">("all");
    const [bankCustomStartDate, setBankCustomStartDate] = useState<string>("");
    const [bankCustomEndDate, setBankCustomEndDate] = useState<string>("");
    const [bankMarksFilter, setBankMarksFilter] = useState<string>("");
    const [bankSortBy, setBankSortBy] = useState<"newest" | "oldest" | "marks_desc" | "marks_asc">("newest");
    const [bankQuestions, setBankQuestions] = useState<any[]>([]);
    const [isLoadingBank, setIsLoadingBank] = useState(false);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
    const [isAddingQuestions, setIsAddingQuestions] = useState(false);

    // Questions list filter states inside set
    const [setQuestionsSearch, setSetQuestionsSearch] = useState("");
    const [setQuestionsTopicId, setSetQuestionsTopicId] = useState("");
    const [setQuestionsSort, setSetQuestionsSort] = useState<"default" | "marks_desc" | "marks_asc">("default");

    // Convert to Test Series modal state
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [testName, setTestName] = useState(initialSet.name);
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [validUntil, setValidUntil] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    });
    const [accessType, setAccessType] = useState<"public" | "invite_only" | "private">(
        initialSet.visibility === 1 ? "public" : "private"
    );
    const [isConverting, setIsConverting] = useState(false);

    // Fetch question bank when modal opens or search/topic/date changes
    useEffect(() => {
        if (!isAddModalOpen) return;

        let cancelled = false;
        const fetchQuestions = async () => {
            setIsLoadingBank(true);
            try {
                const params = new URLSearchParams();
                if (bankSearch.trim()) params.set("search", bankSearch.trim());
                if (bankTopicId) params.set("topic_id", bankTopicId);
                params.set("page_size", "100");

                if (bankDateRange !== "all") {
                    const now = new Date();
                    let startDate: Date | null = null;
                    let endDate: Date | null = null;
                    if (bankDateRange === "today") {
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    } else if (bankDateRange === "7days") {
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    } else if (bankDateRange === "30days") {
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    } else if (bankDateRange === "90days") {
                        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    } else if (bankDateRange === "custom") {
                        if (bankCustomStartDate) {
                            startDate = new Date(bankCustomStartDate);
                        }
                        if (bankCustomEndDate) {
                            endDate = new Date(bankCustomEndDate + "T23:59:59.999Z");
                        }
                    }
                    if (startDate) {
                        params.set("start_date", startDate.toISOString());
                    }
                    if (endDate) {
                        params.set("end_date", endDate.toISOString());
                    }
                }

                const res = await fetch(`/api/questions?${params.toString()}`);
                if (!res.ok) throw new Error("Failed to load questions");
                const data = await res.json();
                const list = Array.isArray(data) ? data : data.items || [];
                if (!cancelled) setBankQuestions(list);
            } catch (err: unknown) {
                if (!cancelled) {
                    toast.error("Failed to load questions from bank");
                }
            } finally {
                if (!cancelled) setIsLoadingBank(false);
            }
        };

        const timer = setTimeout(() => {
            void fetchQuestions();
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [isAddModalOpen, bankSearch, bankTopicId, bankDateRange, bankCustomStartDate, bankCustomEndDate]);

    // Combined list of all available topics from useTopics() + bank questions
    const allBankTopics = useMemo(() => {
        const map = new Map<string, string>();
        topics.forEach((t: { id: number; name: string }) => {
            if (t.id && t.name) map.set(String(t.id), t.name);
        });
        bankQuestions.forEach((bq: any) => {
            const tid = bq.topic_id ?? bq.topic?.id;
            const tname = bq.topic?.name ?? bq.topic_name;
            if (tid && tname) map.set(String(tid), tname);
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [topics, bankQuestions]);

    const displayedBankQuestions = useMemo(() => {
        const list = bankQuestions.filter((q: any) => {
            if (bankMarksFilter) {
                const m = parseFloat(q.marks);
                if (bankMarksFilter === "5+") {
                    if (m < 5) return false;
                } else if (m !== parseFloat(bankMarksFilter)) {
                    return false;
                }
            }
            if (bankTopicId) {
                const qTopicId = q.topic_id ?? q.topic?.id;
                if (String(qTopicId) !== bankTopicId) return false;
            }
            if (bankDateRange !== "all" && q.created_at) {
                const qTime = new Date(q.created_at).getTime();
                const now = Date.now();
                if (bankDateRange === "today") {
                    const startToday = new Date();
                    startToday.setHours(0, 0, 0, 0);
                    if (qTime < startToday.getTime()) return false;
                } else if (bankDateRange === "7days") {
                    if (qTime < now - 7 * 86400000) return false;
                } else if (bankDateRange === "30days") {
                    if (qTime < now - 30 * 86400000) return false;
                } else if (bankDateRange === "90days") {
                    if (qTime < now - 90 * 86400000) return false;
                } else if (bankDateRange === "custom") {
                    if (bankCustomStartDate) {
                        const startMs = new Date(bankCustomStartDate).getTime();
                        if (qTime < startMs) return false;
                    }
                    if (bankCustomEndDate) {
                        const endMs = new Date(bankCustomEndDate + "T23:59:59.999Z").getTime();
                        if (qTime > endMs) return false;
                    }
                }
            }
            return true;
        });

        return list.sort((a: any, b: any) => {
            if (bankSortBy === "newest") {
                const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id;
                const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id;
                return timeB - timeA;
            }
            if (bankSortBy === "oldest") {
                const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id;
                const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id;
                return timeA - timeB;
            }
            if (bankSortBy === "marks_desc") {
                return parseFloat(b.marks || "0") - parseFloat(a.marks || "0");
            }
            if (bankSortBy === "marks_asc") {
                return parseFloat(a.marks || "0") - parseFloat(b.marks || "0");
            }
            return 0;
        });
    }, [bankQuestions, bankMarksFilter, bankTopicId, bankDateRange, bankCustomStartDate, bankCustomEndDate, bankSortBy]);

    const handleSelectAllBank = () => {
        const unaddedIds = displayedBankQuestions
            .filter((bq: any) => !set.questions.some((q: QuestionInSet) => q.id === bq.id))
            .map((bq: any) => bq.id);
        setSelectedQuestionIds((prev) => new Set([...prev, ...unaddedIds]));
    };

    const handleClearSelectionBank = () => {
        setSelectedQuestionIds(new Set());
    };

    // Filter questions inside the current question set
    const filteredSetQuestions = useMemo(() => {
        return set.questions
            .filter((q: QuestionInSet) => {
                if (setQuestionsTopicId && String(q.topic_id) !== setQuestionsTopicId) return false;
                if (setQuestionsSearch.trim()) {
                    const term = setQuestionsSearch.toLowerCase().trim();
                    const text = q.question.toLowerCase();
                    const topic = q.topic_name?.toLowerCase() || "";
                    if (!text.includes(term) && !topic.includes(term)) return false;
                }
                return true;
            })
            .sort((a: QuestionInSet, b: QuestionInSet) => {
                if (setQuestionsSort === "marks_desc") return b.marks - a.marks;
                if (setQuestionsSort === "marks_asc") return a.marks - b.marks;
                return 0;
            });
    }, [set.questions, setQuestionsSearch, setQuestionsTopicId, setQuestionsSort]);

    // Update Set Name
    const handleSaveName = async () => {
        if (!setName.trim() || setName === set.name) {
            setIsEditingName(false);
            return;
        }

        try {
            const res = await fetch(`/api/backend/question-sets/${set.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: setName.trim() }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to update name");
            }
            setSet((prev) => ({ ...prev, name: setName.trim() }));
            setIsEditingName(false);
            toast.success("Question set name updated");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to update name");
        }
    };

    // Toggle Visibility
    const handleToggleVisibility = async () => {
        const newVis = set.visibility === 1 ? 0 : 1;
        try {
            const res = await fetch(`/api/backend/question-sets/${set.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visibility: newVis }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to change visibility");
            }
            setSet((prev) => ({ ...prev, visibility: newVis }));
            toast.success(
                newVis === 1
                    ? "Visibility changed to Public (accessible to all)"
                    : "Visibility changed to Organization Only (Private)"
            );
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to change visibility");
        }
    };

    // Remove Question
    const handleRemoveQuestion = async (questionId: number) => {
        if (!confirm("Remove this question from the set?")) return;
        try {
            const res = await fetch(`/api/backend/question-sets/${set.id}/questions/${questionId}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to remove question");
            }
            setSet((prev) => ({
                ...prev,
                questions: prev.questions.filter((q) => q.id !== questionId),
                question_count: Math.max(0, prev.question_count - 1),
            }));
            toast.success("Question removed from set");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to remove question");
        }
    };

    // Add Selected Questions
    const handleAddSelectedQuestions = async () => {
        if (selectedQuestionIds.size === 0) {
            toast.error("Please select at least one question");
            return;
        }

        setIsAddingQuestions(true);
        try {
            const ids = Array.from(selectedQuestionIds);
            const res = await fetch(`/api/backend/question-sets/${set.id}/questions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question_ids: ids }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to add questions");
            }

            // Re-fetch set detail to refresh questions
            const detailRes = await fetch(`/api/backend/question-sets/${set.id}`);
            if (detailRes.ok) {
                const refreshed = await detailRes.json();
                setSet(refreshed);
            }

            toast.success(`Added ${ids.length} questions to '${set.name}'`);
            setSelectedQuestionIds(new Set());
            setIsAddModalOpen(false);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to add questions");
        } finally {
            setIsAddingQuestions(false);
        }
    };

    // Toggle question selection in picker
    const toggleSelectQuestion = (id: number) => {
        setSelectedQuestionIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Edit Question Handlers
    const handleOpenEditModal = (q: QuestionInSet) => {
        setEditingQuestion(q);
        setEditQText(q.question || "");
        setEditQMarks(String(q.marks || 1));
        setEditQTopicId(q.topic_id ? String(q.topic_id) : "");
        setEditQOptions(
            q.options && q.options.length > 0
                ? q.options.map((opt) => ({ id: opt.id, ans: opt.ans, is_correct: opt.is_correct }))
                : [
                      { ans: "", is_correct: true },
                      { ans: "", is_correct: false },
                      { ans: "", is_correct: false },
                      { ans: "", is_correct: false },
                  ]
        );
        setIsEditModalOpen(true);
    };

    const handleSaveEditQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingQuestion) return;

        const plainText = editQText.replace(/<[^>]*>/g, "").trim();
        if (!plainText) {
            toast.error("Question description cannot be empty");
            return;
        }

        if (editQOptions.some((opt) => !opt.ans.trim())) {
            toast.error("Please fill in text for all options");
            return;
        }

        const marksNum = parseFloat(editQMarks);
        if (!Number.isFinite(marksNum) || marksNum <= 0) {
            toast.error("Marks must be greater than zero");
            return;
        }

        const correctCount = editQOptions.filter((opt) => opt.is_correct).length;
        if (correctCount !== 1) {
            toast.error("Please select exactly one correct answer option");
            return;
        }

        setIsSavingEdit(true);
        try {
            const res = await fetch(`/api/questions/${editingQuestion.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: editQText,
                    marks: marksNum,
                    topic_id: editQTopicId ? Number(editQTopicId) : null,
                    options: editQOptions.map((opt) => ({
                        ans: opt.ans.trim(),
                        is_correct: opt.is_correct,
                    })),
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || err.detail || "Failed to update question");
            }

            const chosenTopic = topics.find((t) => String(t.id) === editQTopicId);

            // Update question in state
            setSet((prev) => ({
                ...prev,
                questions: prev.questions.map((item) => {
                    if (item.id === editingQuestion.id) {
                        return {
                            ...item,
                            question: editQText,
                            marks: marksNum,
                            topic_id: editQTopicId ? Number(editQTopicId) : null,
                            topic_name: chosenTopic ? chosenTopic.name : item.topic_name,
                            options: editQOptions.map((opt, i) => ({
                                id: opt.id || i,
                                ans: opt.ans.trim(),
                                is_correct: opt.is_correct,
                            })),
                        };
                    }
                    return item;
                }),
            }));

            toast.success("Question updated successfully!");
            setIsEditModalOpen(false);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to update question");
        } finally {
            setIsSavingEdit(false);
        }
    };

    // Convert Set into Test Series
    const handleConvertToTestSeries = async (e: React.FormEvent) => {
        e.preventDefault();
        if (set.questions.length === 0) {
            toast.error("Cannot create a test series from an empty set. Please add questions first.");
            return;
        }

        setIsConverting(true);
        try {
            const res = await fetch(`/api/backend/question-sets/${set.id}/convert-to-test-series`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: testName.trim(),
                    duration_minutes: durationMinutes,
                    valid_until: new Date(validUntil).toISOString(),
                    access_type: accessType,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to convert into test series");
            }
            const result = await res.json();

            toast.success(`Test series '${result.name}' generated!`);
            setIsConvertModalOpen(false);
            router.push(`/test-series/${result.id}`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to convert into test series");
        } finally {
            setIsConverting(false);
        }
    };

    const existingQuestionIds = new Set(set.questions.map((q) => q.id));

    return (
        <div className="mx-auto max-w-6xl space-y-6 pb-24">
            {/* Header & Back Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2 -ml-2"
                            nativeButton={false}
                            render={<Link href="/question-sets" />}
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Question Sets
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={setName}
                                    onChange={(e) => setSetName(e.target.value)}
                                    className="h-9 font-bold text-lg max-w-md"
                                    autoFocus
                                    onKeyDown={(e) => e.key === "Enter" && void handleSaveName()}
                                />
                                <Button size="sm" onClick={() => void handleSaveName()} className="h-9 text-xs">
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setSetName(set.name);
                                        setIsEditingName(false);
                                    }}
                                    className="h-9 text-xs"
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                    {set.name}
                                </h1>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                                    title="Rename Set"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* Visibility Pill with Toggle */}
                        <button
                            onClick={handleToggleVisibility}
                            className="cursor-pointer transition-transform hover:scale-105"
                            title="Click to toggle between Public and Organization Only"
                        >
                            {set.visibility === 1 ? (
                                <Badge
                                    variant="secondary"
                                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 gap-1 text-xs font-semibold py-1 px-2.5"
                                >
                                    <Globe className="h-3.5 w-3.5" />
                                    Public (All Organizations)
                                </Badge>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 gap-1 text-xs font-semibold py-1 px-2.5"
                                >
                                    <Building2 className="h-3.5 w-3.5" />
                                    Organization Only (Private)
                                </Badge>
                            )}
                        </button>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Contains <strong>{set.questions.length}</strong> questions • Ready for assembly or test conversion.
                    </p>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <Button
                        variant="outline"
                        onClick={() => setIsAddModalOpen(true)}
                        className="gap-1.5 shadow-2xs font-medium text-xs sm:text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Add Questions
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setIsBulkModalOpen(true)}
                        className="gap-1.5 shadow-2xs font-medium text-xs sm:text-sm"
                    >
                        <UploadCloud className="h-4 w-4" />
                        Bulk Upload
                    </Button>

                    <Button
                        onClick={() => setIsConvertModalOpen(true)}
                        disabled={set.questions.length === 0}
                        className="gap-1.5 shadow-xs font-medium text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
                    >
                        <Rocket className="h-4 w-4" />
                        Convert to Test Series
                    </Button>
                </div>
            </div>

            {/* Questions List */}
            {set.questions.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <BookOpen className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground">This Question Set is Empty</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                            Start adding questions from your question bank or bulk upload new ones with JSON, interactive builder, or AI.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button onClick={() => setIsAddModalOpen(true)} className="gap-1.5 text-xs font-medium">
                            <Plus className="h-4 w-4" />
                            Add from Question Bank
                        </Button>
                        <Button variant="outline" onClick={() => setIsBulkModalOpen(true)} className="gap-1.5 text-xs font-medium">
                            <UploadCloud className="h-4 w-4" />
                            Bulk Upload Questions
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Filter and Sort Toolbar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border bg-card">
                        <div className="relative flex-1 w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Filter questions in this set..."
                                value={setQuestionsSearch}
                                onChange={(e) => setSetQuestionsSearch(e.target.value)}
                                className="pl-8 h-8 text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
                            <select
                                value={setQuestionsTopicId}
                                onChange={(e) => setSetQuestionsTopicId(e.target.value)}
                                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="">All Topics</option>
                                {Array.from(new Set(set.questions.map((q) => q.topic_id).filter(Boolean))).map((tId) => {
                                    const qTopic = set.questions.find((q) => q.topic_id === tId);
                                    return (
                                        <option key={tId} value={String(tId)}>
                                            {qTopic?.topic_name || `Topic #${tId}`}
                                        </option>
                                    );
                                })}
                            </select>

                            <select
                                value={setQuestionsSort}
                                onChange={(e) => setSetQuestionsSort(e.target.value as any)}
                                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="default">Default Order</option>
                                <option value="marks_desc">Marks: High to Low</option>
                                <option value="marks_asc">Marks: Low to High</option>
                            </select>

                            {(setQuestionsSearch || setQuestionsTopicId || setQuestionsSort !== "default") && (
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => {
                                        setSetQuestionsSearch("");
                                        setSetQuestionsTopicId("");
                                        setSetQuestionsSort("default");
                                    }}
                                    className="h-8 text-xs text-muted-foreground"
                                >
                                    Reset
                                </Button>
                            )}
                            <span className="text-[11px] text-muted-foreground font-medium pl-1">
                                Showing {filteredSetQuestions.length} of {set.questions.length}
                            </span>
                        </div>
                    </div>

                    {filteredSetQuestions.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground text-xs">
                            No questions in this set match your current filter.
                        </div>
                    ) : filteredSetQuestions.map((q: QuestionInSet, idx: number) => (
                        <Card key={q.id} className="overflow-hidden border-border/70 shadow-xs hover:border-primary/40 transition-colors">
                            <CardHeader className="bg-muted/40 py-3 px-4 border-b flex flex-row items-center justify-between space-y-0 gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="font-mono text-xs">
                                        #{idx + 1}
                                    </Badge>
                                    {q.topic_name && (
                                        <Badge variant="secondary" className="text-[11px] font-medium">
                                            {q.topic_name}
                                        </Badge>
                                    )}
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        ({q.marks} mark{q.marks !== 1 ? "s" : ""})
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenEditModal(q)}
                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted gap-1 cursor-pointer"
                                    >
                                        <Edit3 className="h-3 w-3" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveQuestion(q.id)}
                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1 cursor-pointer"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Remove
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-5 space-y-3">
                                <div
                                    className="text-sm font-medium leading-relaxed text-foreground"
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeHtmlContent(q.question),
                                    }}
                                />

                                {q.diagram_path && (
                                    <div className="my-2 rounded-lg border bg-muted/20 p-2 max-w-sm">
                                        <img
                                            src={`/api/backend/${q.diagram_path.replace(/^\//, "")}`}
                                            alt="Diagram"
                                            className="max-h-52 rounded object-contain"
                                        />
                                    </div>
                                )}

                                <div className="grid gap-2 sm:grid-cols-2 pt-1">
                                    {q.options.map((opt: { id?: number; ans: string; is_correct: boolean }) => (
                                        <div
                                            key={opt.id}
                                            className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs sm:text-sm ${
                                                opt.is_correct
                                                    ? "border-emerald-500 bg-emerald-500/5 font-medium"
                                                    : "border-border bg-card"
                                            }`}
                                        >
                                            <div className="pt-0.5 shrink-0">
                                                {opt.is_correct ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                                                ) : (
                                                    <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                                                )}
                                            </div>
                                            <div
                                                className="flex-1"
                                                dangerouslySetInnerHTML={{
                                                    __html: sanitizeHtmlContent(opt.ans),
                                                }}
                                            />
                                            {opt.is_correct && (
                                                <Badge
                                                    variant="outline"
                                                    className="ml-auto text-[10px] shrink-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                >
                                                    Correct
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Add Questions Modal ── */}
            {isAddModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
                        <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/30">
                            <div>
                                <h3 className="font-bold text-base text-foreground">Add Questions from Bank</h3>
                                <p className="text-xs text-muted-foreground">
                                    Select questions to add to '{set.name}' ({selectedQuestionIds.size} selected)
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsAddModalOpen(false)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-4 border-b bg-card space-y-2.5">
                            <div className="flex flex-col sm:flex-row gap-2.5 items-center">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search questions by text or keyword…"
                                        value={bankSearch}
                                        onChange={(e) => setBankSearch(e.target.value)}
                                        className="pl-9 h-9 text-xs"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                    <Button
                                        type="button"
                                        size="xs"
                                        variant="outline"
                                        onClick={handleSelectAllBank}
                                        className="h-9 text-xs px-2.5"
                                    >
                                        Select All ({displayedBankQuestions.filter((bq: any) => !existingQuestionIds.has(bq.id)).length})
                                    </Button>
                                    <Button
                                        type="button"
                                        size="xs"
                                        variant="ghost"
                                        onClick={handleClearSelectionBank}
                                        className="h-9 text-xs px-2.5 text-muted-foreground"
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </div>

                            {/* Additional filter dropdowns: Topic, Date, Marks, Sort */}
                            <div className="space-y-2 pt-2 border-t text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-muted-foreground font-semibold flex items-center gap-1 text-[11px] shrink-0">
                                        <Filter className="h-3 w-3 text-primary" /> Filters:
                                    </span>

                                    {/* Topic selector */}
                                    <select
                                        value={bankTopicId}
                                        onChange={(e) => setBankTopicId(e.target.value)}
                                        className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0 max-w-[160px]"
                                    >
                                        <option value="">All Topics ({allBankTopics.length})</option>
                                        {allBankTopics.map((t: { id: string; name: string }) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>

                                    {/* Date range presets */}
                                    <select
                                        value={bankDateRange}
                                        onChange={(e) => setBankDateRange(e.target.value as any)}
                                        className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
                                    >
                                        <option value="all">All Dates</option>
                                        <option value="today">Created Today</option>
                                        <option value="7days">Past 7 Days</option>
                                        <option value="30days">Past 30 Days</option>
                                        <option value="90days">Past 90 Days</option>
                                        <option value="custom">Custom Range 📅</option>
                                    </select>

                                    {/* Marks filter */}
                                    <select
                                        value={bankMarksFilter}
                                        onChange={(e) => setBankMarksFilter(e.target.value)}
                                        className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
                                    >
                                        <option value="">All Marks</option>
                                        <option value="1">1 Mark</option>
                                        <option value="2">2 Marks</option>
                                        <option value="3">3 Marks</option>
                                        <option value="4">4 Marks</option>
                                        <option value="5+">5+ Marks</option>
                                    </select>

                                    {/* Sort order */}
                                    <select
                                        value={bankSortBy}
                                        onChange={(e) => setBankSortBy(e.target.value as any)}
                                        className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0 ml-auto"
                                    >
                                        <option value="newest">Sort: Newest First</option>
                                        <option value="oldest">Sort: Oldest First</option>
                                        <option value="marks_desc">Sort: Marks (High to Low)</option>
                                        <option value="marks_asc">Sort: Marks (Low to High)</option>
                                    </select>
                                </div>

                                {/* Custom Date Range Inputs (when custom selected) */}
                                {bankDateRange === "custom" && (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-dashed text-xs">
                                        <span className="text-muted-foreground font-medium text-[11px] flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-primary" /> Range:
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-muted-foreground">From</span>
                                            <Input
                                                type="date"
                                                value={bankCustomStartDate}
                                                onChange={(e) => setBankCustomStartDate(e.target.value)}
                                                className="h-7 text-xs w-36 px-2 py-0.5"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-muted-foreground">To</span>
                                            <Input
                                                type="date"
                                                value={bankCustomEndDate}
                                                onChange={(e) => setBankCustomEndDate(e.target.value)}
                                                className="h-7 text-xs w-36 px-2 py-0.5"
                                            />
                                        </div>
                                        {(bankCustomStartDate || bankCustomEndDate) && (
                                            <Button
                                                size="xs"
                                                variant="ghost"
                                                onClick={() => {
                                                    setBankCustomStartDate("");
                                                    setBankCustomEndDate("");
                                                }}
                                                className="h-6 text-[10px] text-muted-foreground px-1.5"
                                            >
                                                Clear Dates
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Active Filters Chips */}
                                {(bankTopicId || bankDateRange !== "all" || bankMarksFilter || bankSearch) && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                                        <span className="text-muted-foreground text-[10px]">Active:</span>
                                        {bankTopicId && (
                                            <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-2 h-5">
                                                Topic: {allBankTopics.find((t: { id: string; name: string }) => String(t.id) === bankTopicId)?.name || bankTopicId}
                                                <button
                                                    onClick={() => setBankTopicId("")}
                                                    className="hover:text-destructive"
                                                >
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            </Badge>
                                        )}
                                        {bankDateRange !== "all" && (
                                            <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-2 h-5">
                                                Date: {
                                                    bankDateRange === "today" ? "Today" :
                                                    bankDateRange === "7days" ? "Past 7 Days" :
                                                    bankDateRange === "30days" ? "Past 30 Days" :
                                                    bankDateRange === "90days" ? "Past 90 Days" :
                                                    `Custom (${bankCustomStartDate || "start"} to ${bankCustomEndDate || "end"})`
                                                }
                                                <button
                                                    onClick={() => {
                                                        setBankDateRange("all");
                                                        setBankCustomStartDate("");
                                                        setBankCustomEndDate("");
                                                    }}
                                                    className="hover:text-destructive"
                                                >
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            </Badge>
                                        )}
                                        {bankMarksFilter && (
                                            <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-2 h-5">
                                                Marks: {bankMarksFilter}
                                                <button
                                                    onClick={() => setBankMarksFilter("")}
                                                    className="hover:text-destructive"
                                                >
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            </Badge>
                                        )}
                                        {bankSearch && (
                                            <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-2 h-5">
                                                Search: &quot;{bankSearch}&quot;
                                                <button
                                                    onClick={() => setBankSearch("")}
                                                    className="hover:text-destructive"
                                                >
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            </Badge>
                                        )}
                                        <Button
                                            size="xs"
                                            variant="ghost"
                                            onClick={() => {
                                                setBankTopicId("");
                                                setBankDateRange("all");
                                                setBankCustomStartDate("");
                                                setBankCustomEndDate("");
                                                setBankMarksFilter("");
                                                setBankSearch("");
                                            }}
                                            className="h-5 text-[10px] text-muted-foreground ml-auto px-1.5"
                                        >
                                            Reset All
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {isLoadingBank ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
                                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                                    <p className="text-xs">Loading question bank…</p>
                                </div>
                            ) : displayedBankQuestions.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground text-xs">
                                    No questions found matching your topic, date, or search filters.
                                </div>
                            ) : (
                                displayedBankQuestions.map((bq: any) => {
                                    const isAlreadyInSet = existingQuestionIds.has(bq.id);
                                    const isSelected = selectedQuestionIds.has(bq.id);

                                    return (
                                        <div
                                            key={bq.id}
                                            onClick={() => !isAlreadyInSet && toggleSelectQuestion(bq.id)}
                                            className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors cursor-pointer text-xs ${
                                                isAlreadyInSet
                                                    ? "opacity-50 bg-muted/40 cursor-not-allowed border-dashed"
                                                    : isSelected
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : "border-border hover:bg-muted/40"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected || isAlreadyInSet}
                                                disabled={isAlreadyInSet}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    if (!isAlreadyInSet) toggleSelectQuestion(bq.id);
                                                }}
                                                className="mt-0.5 h-4 w-4 shrink-0 accent-primary cursor-pointer"
                                            />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                                                        #{bq.id}
                                                    </span>
                                                    {(bq.topic?.name || bq.topic_name) && (
                                                        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                                            {bq.topic?.name || bq.topic_name}
                                                        </Badge>
                                                    )}
                                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                                        ({bq.marks} mark{bq.marks !== "1.00" && bq.marks !== 1 ? "s" : ""})
                                                    </span>
                                                    {bq.created_at && (
                                                        <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1 font-mono">
                                                            <Calendar className="h-3 w-3 text-muted-foreground/60" />
                                                            {formatQuestionDate(bq.created_at)}
                                                        </span>
                                                    )}
                                                    {isAlreadyInSet && (
                                                        <Badge variant="secondary" className="text-[10px] bg-muted">
                                                            Already in set
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div
                                                    className="font-medium text-foreground line-clamp-2"
                                                    dangerouslySetInnerHTML={{
                                                        __html: sanitizeHtmlContent(bq.question),
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/20 text-xs">
                            <span className="text-muted-foreground">
                                <strong>{selectedQuestionIds.size}</strong> questions selected
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddModalOpen(false)}
                                    disabled={isAddingQuestions}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAddSelectedQuestions}
                                    disabled={isAddingQuestions || selectedQuestionIds.size === 0}
                                    className="gap-1.5 font-medium"
                                >
                                    {isAddingQuestions && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Add Selected ({selectedQuestionIds.size})
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Convert to Test Series Modal ── */}
            {isConvertModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-lg rounded-2xl border bg-background shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/30">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Rocket className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-foreground">Launch Test Series</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Convert this set of {set.questions.length} questions into an active exam
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsConvertModalOpen(false)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleConvertToTestSeries} className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Test Series Title</label>
                                <Input
                                    value={testName}
                                    onChange={(e) => setTestName(e.target.value)}
                                    required
                                    className="text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Duration (Minutes)</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={600}
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                        required
                                        className="text-sm font-mono"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Valid Until</label>
                                    <Input
                                        type="datetime-local"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        required
                                        className="text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground">Access Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <label
                                        className={`flex flex-col gap-1 p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                                            accessType === "public"
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-semibold"
                                                : "border-border hover:bg-muted/40"
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-1.5 text-xs">
                                            <input
                                                type="radio"
                                                name="accessType"
                                                checked={accessType === "public"}
                                                onChange={() => setAccessType("public")}
                                                className="accent-emerald-500"
                                            />
                                            <Globe className="h-3.5 w-3.5 text-emerald-500" />
                                            <span>Public</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-normal">
                                            All students
                                        </span>
                                    </label>

                                    <label
                                        className={`flex flex-col gap-1 p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                                            accessType === "private"
                                                ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 font-semibold"
                                                : "border-border hover:bg-muted/40"
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-1.5 text-xs">
                                            <input
                                                type="radio"
                                                name="accessType"
                                                checked={accessType === "private"}
                                                onChange={() => setAccessType("private")}
                                                className="accent-amber-500"
                                            />
                                            <Building2 className="h-3.5 w-3.5 text-amber-500" />
                                            <span>Private</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-normal">
                                            Organization
                                        </span>
                                    </label>

                                    <label
                                        className={`flex flex-col gap-1 p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                                            accessType === "invite_only"
                                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                                : "border-border hover:bg-muted/40"
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-1.5 text-xs">
                                            <input
                                                type="radio"
                                                name="accessType"
                                                checked={accessType === "invite_only"}
                                                onChange={() => setAccessType("invite_only")}
                                                className="accent-primary"
                                            />
                                            <span>Invite Code</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-normal">
                                            Code only
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsConvertModalOpen(false)}
                                    disabled={isConverting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={isConverting} className="gap-1.5 font-medium">
                                    {isConverting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Create Test Series Now
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Upload Questions Modal */}
            {isBulkModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
                    onClick={() => setIsBulkModalOpen(false)}
                >
                    <div
                        className="relative bg-background border rounded-xl shadow-lg w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
                            <div>
                                <h3 className="text-lg font-semibold leading-none tracking-tight">Bulk Upload Questions</h3>
                                <p className="text-sm text-muted-foreground mt-1.5">
                                    Use the interactive builder, JSON upload, or AI generator to add questions to &apos;{set.name}&apos;.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full shrink-0"
                                onClick={() => setIsBulkModalOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                            <AdvancedBulkUpload
                                preselectedQuestionSetId={set.id}
                                onSuccess={async () => {
                                    // Refresh questions in the set
                                    const res = await fetch(`/api/backend/question-sets/${set.id}`);
                                    if (res.ok) {
                                        const refreshed = await res.json();
                                        setSet(refreshed);
                                    }
                                    setIsBulkModalOpen(false);
                                }}
                                onCancel={() => setIsBulkModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Question Modal */}
            {isEditModalOpen && editingQuestion && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
                    onClick={() => setIsEditModalOpen(false)}
                >
                    <div
                        className="relative bg-background border rounded-xl shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
                            <div>
                                <h3 className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
                                    <Edit3 className="h-4 w-4 text-primary" />
                                    Edit Question (ID: #{editingQuestion.id})
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1.5">
                                    Update question text, marks, topic, and options.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full shrink-0"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleSaveEditQuestion} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-5 flex-1">
                                <div>
                                    <Label className="mb-2 block font-medium text-xs">Question Description</Label>
                                    <div className="overflow-hidden rounded-lg bg-white border text-black">
                                        <ReactQuill
                                            theme="snow"
                                            value={editQText}
                                            onChange={setEditQText}
                                            placeholder="Write question text here..."
                                            modules={QUILL_MODULES}
                                            formats={QUILL_FORMATS}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-q-marks" className="text-xs">Marks</Label>
                                        <Input
                                            id="edit-q-marks"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            required
                                            value={editQMarks}
                                            onChange={(e) => setEditQMarks(e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-q-topic" className="text-xs">Topic</Label>
                                        <select
                                            id="edit-q-topic"
                                            className="border-input bg-background h-8 w-full rounded-md border px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                            value={editQTopicId}
                                            onChange={(e) => setEditQTopicId(e.target.value)}
                                        >
                                            <option value="">No topic</option>
                                            {topics.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold">Answer Options (Select correct option)</Label>
                                        {editQOptions.length < 6 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="xs"
                                                onClick={() =>
                                                    setEditQOptions((prev) => [...prev, { ans: "", is_correct: false }])
                                                }
                                                className="text-xs text-primary gap-1 h-6 px-2"
                                            >
                                                <Plus className="h-3 w-3" />
                                                Add Option
                                            </Button>
                                        )}
                                    </div>

                                    <RadioGroup
                                        value={String(editQOptions.findIndex((o) => o.is_correct))}
                                        onValueChange={(val) =>
                                            setEditQOptions((curr) =>
                                                curr.map((opt, idx) => ({
                                                    ...opt,
                                                    is_correct: idx === Number(val),
                                                }))
                                            )
                                        }
                                        className="space-y-2.5"
                                    >
                                        {editQOptions.map((opt, index) => (
                                            <div key={index} className="flex items-center gap-2.5">
                                                <RadioGroupItem value={String(index)} aria-label={`Option ${index + 1} is correct`} />
                                                <Input
                                                    value={opt.ans}
                                                    onChange={(e) =>
                                                        setEditQOptions((curr) =>
                                                            curr.map((item, idx) =>
                                                                idx === index ? { ...item, ans: e.target.value } : item
                                                            )
                                                        )
                                                    }
                                                    placeholder={`Option ${index + 1}`}
                                                    className="flex-1 h-8 text-xs"
                                                    required
                                                />
                                                {editQOptions.length > 2 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setEditQOptions((prev) =>
                                                                prev.filter((_, idx) => idx !== index)
                                                            )
                                                        }
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>

                            <div className="px-6 py-3 border-t bg-muted/20 flex items-center justify-end gap-2.5 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={isSavingEdit}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={isSavingEdit} className="gap-1.5 font-medium">
                                    {isSavingEdit && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
