"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import { Search, ChevronLeft, ChevronRight, Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import type { Question } from "../services/questions";
import type { Topic } from "../services/topics";

type QuestionsTableProps = {
    initialQuestions: Question[];
    topics: Topic[];
    users: Record<number, string>;
    organizations: Record<number, string>;
};

export default function QuestionsTable({
    initialQuestions,
    topics,
    users,
    organizations,
}: QuestionsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTopicId, setSelectedTopicId] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Live search filtering
    const filteredQuestions = useMemo(() => {
        let result = initialQuestions;
        if (selectedTopicId) {
            result = result.filter((q) => q.topic_id === Number(selectedTopicId));
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((q) => {
                const plain = sanitizeHtml(q.question ?? q.title ?? "", { allowedTags: [] }).toLowerCase();
                const topicName = q.topic?.name.toLowerCase() ?? "";
                const idStr = String(q.id);
                return plain.includes(query) || topicName.includes(query) || idStr.includes(query);
            });
        }
        return result;
    }, [initialQuestions, searchQuery, selectedTopicId]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredQuestions.length / pageSize);
    const paginatedQuestions = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredQuestions.slice(start, start + pageSize);
    }, [filteredQuestions, currentPage, pageSize]);

    // Reset current page when query changes
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, pageSize, selectedTopicId]);

    return (
        <div className="space-y-4">
            {/* ── Search & Page Size controls ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search questions by ID, text, or topic..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>
                    {topics.length > 0 && (
                        <select
                            value={selectedTopicId}
                            onChange={(e) => setSelectedTopicId(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring shrink-0 min-w-[140px]"
                        >
                            <option value="">All Topics</option>
                            {topics.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rows per page:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* ── Table view ── */}
            {filteredQuestions.length === 0 ? (
                <div className="rounded-xl border border-dashed p-12 text-center bg-card">
                    <p className="text-muted-foreground text-sm">No questions found matching your criteria.</p>
                </div>
            ) : (
                <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="px-4 py-3 w-16">ID</TableHead>
                                <TableHead className="px-4 py-3 min-w-[200px]">Question text</TableHead>
                                <TableHead className="px-4 py-3 w-28">Topic</TableHead>
                                <TableHead className="px-4 py-3 w-24">Marks</TableHead>
                                <TableHead className="px-4 py-3 w-24">Status</TableHead>
                                <TableHead className="px-4 py-3 w-40">Creator / Org</TableHead>
                                <TableHead className="px-4 py-3 w-20 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {paginatedQuestions.map((q) => {
                                const plain = sanitizeHtml(q.question ?? q.title ?? "", { allowedTags: [] });
                                const creator = q.is_global ? "Global" : users[q.user_id] ?? `User #${q.user_id}`;
                                const org = q.is_global ? "" : organizations[q.organization_id] ?? `Org #${q.organization_id}`;

                                return (
                                    <TableRow key={q.id} className="hover:bg-muted/10 transition-colors">
                                        <TableCell className="px-4 py-3.5 font-mono text-muted-foreground">#{q.id}</TableCell>
                                        <TableCell className="px-4 py-3.5 max-w-md whitespace-normal">
                                            <div className="space-y-1.5">
                                                <div
                                                    className="font-medium line-clamp-2 leading-relaxed"
                                                    dangerouslySetInnerHTML={{
                                                        __html: sanitizeHtml(q.question ?? q.title ?? "", {
                                                            allowedTags: [
                                                                ...sanitizeHtml.defaults.allowedTags,
                                                                "sub",
                                                                "sup",
                                                            ],
                                                        }),
                                                    }}
                                                    title={plain}
                                                />
                                                {q.options && q.options.length > 0 && (
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-mono">
                                                        {q.options.slice(0, 4).map((opt, i) => (
                                                            <span
                                                                key={opt.id ?? i}
                                                                className={opt.is_correct ? "text-green-600 font-semibold" : ""}
                                                            >
                                                                {String.fromCharCode(65 + i)}. {opt.ans}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            {q.topic ? (
                                                <Badge
                                                    style={{
                                                        backgroundColor: q.topic.color,
                                                        color: "#ffffff",
                                                        borderColor: "transparent",
                                                    }}
                                                    className="text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap"
                                                >
                                                    {q.topic.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground italic">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5 font-semibold text-foreground whitespace-nowrap">
                                            {q.marks} marks
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5">
                                            <Badge variant={q.is_active ? "default" : "secondary"} className="text-[10px]">
                                                {q.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5 text-muted-foreground leading-normal whitespace-nowrap">
                                            <div className="font-medium text-foreground">{creator}</div>
                                            {org && <div className="text-[10px]">{org}</div>}
                                        </TableCell>
                                        <TableCell className="px-4 py-3.5 text-right">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                nativeButton={false}
                                                render={<Link href={`/questions/${q.id}`} />}
                                                className="h-7 w-7"
                                                title="Edit question"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* ── Pagination Footer ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                    <p className="text-xs text-muted-foreground">
                        Showing page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                        <span className="font-semibold text-foreground">{totalPages}</span> (
                        <span className="font-semibold">{filteredQuestions.length}</span> total results)
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="h-8 w-8"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
