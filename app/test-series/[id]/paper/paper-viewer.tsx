"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Printer,
    Download,
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    Columns2,
    Square,
    ZoomIn,
    ZoomOut,
    Sparkles,
    FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtmlContent } from "@/lib/sanitize";

export type PaperOption = {
    id: number;
    text: string;
    ans: string;
    is_correct: boolean;
    diagram_path?: string | null;
};

export type PaperQuestion = {
    question_id: number;
    question: string;
    marks: number | null;
    negative_marks?: number | null;
    options: PaperOption[];
    diagram_path?: string | null;
    diagrams?: { id: number; path: string }[];
    topic?: { id: number; name: string } | null;
};

export type PaperData = {
    series_id: number;
    series_name: string;
    duration_seconds?: number;
    valid_until?: string | null;
    org_id?: number;
    organization_name?: string | null;
    organization_logo?: string | null;
    instructions?: string | null;
    questions: PaperQuestion[];
};

function formatDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return "60 Minutes";
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h} Hour${h > 1 ? "s" : ""} ${m} Min${m > 1 ? "s" : ""}`;
    if (h > 0) return `${h} Hour${h > 1 ? "s" : ""}`;
    return `${m} Minutes`;
}

function getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
}

export default function PaperViewer({ initialData }: { initialData: PaperData }) {
    const [showAnswerKey, setShowAnswerKey] = useState(false);
    const [columns, setColumns] = useState<1 | 2>(1);
    const [fontSize, setFontSize] = useState<"compact" | "normal" | "large">("normal");
    const [showCandidateBox, setShowCandidateBox] = useState(true);
    const [showInstructions, setShowInstructions] = useState(true);
    const [showOrgHeader, setShowOrgHeader] = useState(true);

    const questions = initialData.questions || [];
    const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    const hasNegativeMarks = questions.some((q) => Number(q.negative_marks) > 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-neutral-200 text-neutral-900 print:bg-white print:text-black">
            {/* ── Fixed Floating Controls (Hidden on Print) ── */}
            <div className="no-print sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-xs px-4 py-3">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            nativeButton={false}
                            render={<Link href={`/test-series/${initialData.series_id}`} />}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Editor
                        </Button>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                            {initialData.series_name} — A4 Question Paper
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                            {questions.length} Questions
                        </Badge>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                        {/* Layout Toggle */}
                        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                            <Button
                                type="button"
                                size="sm"
                                variant={columns === 1 ? "default" : "ghost"}
                                className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                                onClick={() => setColumns(1)}
                                title="1-Column Full Width (Recommended - No Overflow)"
                            >
                                <Square className="h-3.5 w-3.5" />
                                1 Column
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={columns === 2 ? "default" : "ghost"}
                                className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                                onClick={() => setColumns(2)}
                                title="2-Column Side-by-Side Exam Grid"
                            >
                                <Columns2 className="h-3.5 w-3.5" />
                                2 Columns
                            </Button>
                        </div>

                        {/* Font size */}
                        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                            <Button
                                type="button"
                                size="sm"
                                variant={fontSize === "compact" ? "default" : "ghost"}
                                className="h-7 px-2 text-xs cursor-pointer"
                                onClick={() => setFontSize("compact")}
                                title="Compact Text (Saves paper)"
                            >
                                Compact
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={fontSize === "normal" ? "default" : "ghost"}
                                className="h-7 px-2 text-xs cursor-pointer"
                                onClick={() => setFontSize("normal")}
                            >
                                Standard
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={fontSize === "large" ? "default" : "ghost"}
                                className="h-7 px-2 text-xs cursor-pointer"
                                onClick={() => setFontSize("large")}
                            >
                                Large
                            </Button>
                        </div>

                        {/* Answer Key Toggle */}
                        <Button
                            type="button"
                            size="sm"
                            variant={showAnswerKey ? "destructive" : "outline"}
                            className="h-8 gap-1.5 text-xs cursor-pointer"
                            onClick={() => setShowAnswerKey((prev) => !prev)}
                        >
                            {showAnswerKey ? (
                                <>
                                    <Eye className="h-3.5 w-3.5" />
                                    Answer Key: ON (Teacher)
                                </>
                            ) : (
                                <>
                                    <EyeOff className="h-3.5 w-3.5" />
                                    Answer Key: OFF (Student)
                                </>
                            )}
                        </Button>

                        {/* Download Backend Generated PDF Button */}
                        <a
                            href={`/api/backend/test-series/${initialData.series_id}/question-paper-pdf${showAnswerKey ? "?include_answers=true" : ""}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer transition-colors"
                            title="Download backend-generated physical question paper in A4 PDF format"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Download PDF (Backend)
                        </a>

                        {/* Print / Save PDF Button */}
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 gap-1.5 text-xs font-medium cursor-pointer"
                            onClick={handlePrint}
                            title="Print or preview using browser print dialog"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            Print Preview
                        </Button>
                    </div>
                </div>

                {/* Sub-toolbar checkboxes */}
                <div className="mx-auto flex max-w-6xl items-center justify-between border-t mt-2 pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4 flex-wrap">
                        <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground">
                            <input
                                type="checkbox"
                                checked={showCandidateBox}
                                onChange={(e) => setShowCandidateBox(e.target.checked)}
                                className="h-3.5 w-3.5 rounded accent-primary"
                            />
                            Candidate Details Box
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground">
                            <input
                                type="checkbox"
                                checked={showInstructions}
                                onChange={(e) => setShowInstructions(e.target.checked)}
                                className="h-3.5 w-3.5 rounded accent-primary"
                            />
                            Instructions
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground">
                            <input
                                type="checkbox"
                                checked={showOrgHeader}
                                onChange={(e) => setShowOrgHeader(e.target.checked)}
                                className="h-3.5 w-3.5 rounded accent-primary"
                            />
                            Institute Header
                        </label>
                    </div>
                    <span className="hidden sm:inline text-xs text-muted-foreground/80">
                        Tip: Select <strong>Save as PDF</strong> and Paper size <strong>A4</strong> in the print dialog.
                    </span>
                </div>
            </div>

            {/* ── Printable Physical A4 Sheet Container ── */}
            <div className="py-8 px-2 sm:px-4 print:p-0 flex justify-center overflow-x-auto">
                <div
                    className={`paper-sheet w-full max-w-[210mm] bg-white text-black shadow-xl print:shadow-none print:w-full print:max-w-none border print:border-none print:m-0 print:p-0 ${
                        fontSize === "compact"
                            ? "text-[12px] leading-tight"
                            : fontSize === "large"
                            ? "text-[15px] leading-normal"
                            : "text-[13.5px] leading-normal"
                    }`}
                    style={{
                        minHeight: "297mm",
                        padding: "14mm 16mm",
                        boxSizing: "border-box",
                        fontFamily: '"Times New Roman", Times, Georgia, serif',
                    }}
                >
                    {/* ── 1. Institute & Examination Header ── */}
                    {showOrgHeader && (
                        <header className="text-center border-b-2 border-black pb-3 mb-3">
                            {initialData.organization_logo && (
                                <div className="flex justify-center mb-1.5">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`/api/uploads/${initialData.organization_logo.replace(/^uploads\//, "")}`}
                                        alt="Institute Logo"
                                        className="h-12 max-h-12 max-w-full object-contain"
                                    />
                                </div>
                            )}

                            {initialData.organization_name && (
                                <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide break-words">
                                    {initialData.organization_name}
                                </h1>
                            )}

                            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider mt-0.5 break-words">
                                {initialData.series_name}
                            </h2>

                            {showAnswerKey && (
                                <div className="mt-1 inline-block border border-black px-2 py-0.5 text-xs font-bold uppercase tracking-widest bg-neutral-100">
                                    [ TEACHER COPY — ANSWER KEY INCLUDED ]
                                </div>
                            )}
                        </header>
                    )}

                    {/* ── 2. Exam Metadata Table ── */}
                    <div className="border border-black mb-3 text-xs sm:text-sm font-semibold">
                        <div className="grid grid-cols-3 divide-x divide-black py-1 px-2 text-center bg-neutral-50 print:bg-white">
                            <div>
                                <span className="font-bold">Time Allowed:</span>{" "}
                                <span>{formatDuration(initialData.duration_seconds)}</span>
                            </div>
                            <div>
                                <span className="font-bold">Maximum Marks:</span> <span>{totalMarks}</span>
                            </div>
                            <div>
                                <span className="font-bold">Total Questions:</span> <span>{questions.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── 3. Candidate Fill-in Details Box ── */}
                    {showCandidateBox && (
                        <div className="border border-black p-2.5 mb-3 text-xs leading-relaxed">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold shrink-0">Candidate Name:</span>{" "}
                                    <span className="border-b border-dotted border-black flex-1 min-w-[120px]" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold shrink-0">Roll / Reg. No:</span>{" "}
                                    <span className="border-b border-dotted border-black flex-1 min-w-[80px]" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold shrink-0">Batch / Section:</span>{" "}
                                    <span className="border-b border-dotted border-black flex-1 min-w-[100px]" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold shrink-0">Date of Exam:</span>{" "}
                                    <span className="border-b border-dotted border-black flex-1 min-w-[80px]" />
                                </div>
                                <div className="flex items-center gap-1.5 pt-1">
                                    <span className="font-bold shrink-0">Candidate Signature:</span>{" "}
                                    <span className="border-b border-dotted border-black flex-1 min-w-[100px]" />
                                </div>
                                <div className="flex items-center gap-1.5 pt-1">
                                    <span className="font-bold shrink-0">Invigilator Signature:</span>{" "}
                                    <span className="border-b border-dotted border-black flex-1 min-w-[100px]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── 4. General Instructions Section ── */}
                    {showInstructions && (
                        <div className="border-t border-b border-black py-2 mb-4 text-xs">
                            <p className="font-bold uppercase tracking-wider mb-1 underline">
                                General Instructions:
                            </p>
                            {initialData.instructions && initialData.instructions.trim() ? (
                                <div
                                    className="prose prose-sm max-w-none text-black break-words [&_p]:my-0.5 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeHtmlContent(initialData.instructions),
                                    }}
                                />
                            ) : (
                                <ol className="list-decimal ml-4 space-y-0.5">
                                    <li>This question paper contains {questions.length} multiple-choice questions. All questions are compulsory.</li>
                                    <li>Each question has four alternative options (A, B, C, D). Darken/tick the single most appropriate option.</li>
                                    {hasNegativeMarks ? (
                                        <li>Wrong answers will attract negative marking as specified for each question. Unattempted questions carry zero marks.</li>
                                    ) : (
                                        <li>There is no negative marking for incorrect answers.</li>
                                    )}
                                    <li>Do not write anything on the question paper except your Roll Number and Name in the designated box.</li>
                                    <li>Electronic devices, smart watches, and calculators are strictly prohibited.</li>
                                </ol>
                            )}
                        </div>
                    )}

                    {/* ── 5. Questions Section ── */}
                    <div
                        className={
                            columns === 2
                                ? "grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-4 items-start"
                                : "space-y-4"
                        }
                    >
                        {questions.map((q, idx) => {
                            const qMarks = Number(q.marks) || 1;
                            const negMarks = Number(q.negative_marks) || 0;

                            return (
                                <div
                                    key={q.question_id || idx}
                                    className="question-item break-inside-avoid pb-3 border-b border-neutral-300 print:border-neutral-400 overflow-hidden w-full"
                                    style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
                                >
                                    {/* Question Header & Statement */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 font-serif min-w-0 break-words">
                                            <span className="font-bold mr-1.5 shrink-0">Q.{idx + 1}</span>
                                            <span
                                                className="inline font-medium break-words [&_table]:max-w-full [&_table]:table-auto [&_img]:max-w-full [&_pre]:whitespace-pre-wrap"
                                                dangerouslySetInnerHTML={{
                                                    __html: sanitizeHtmlContent(q.question),
                                                }}
                                            />
                                        </div>
                                        <div className="shrink-0 text-[11px] font-mono font-bold text-neutral-600 print:text-black">
                                            [{qMarks}M{negMarks > 0 ? `, -${negMarks}` : ""}]
                                        </div>
                                    </div>

                                    {/* Question Diagrams (if any) */}
                                    {q.diagrams && q.diagrams.length > 0 ? (
                                        <div className="my-2 flex flex-wrap gap-2 justify-center overflow-hidden">
                                            {q.diagrams.map((d) => (
                                                <img
                                                    key={d.id}
                                                    src={`/api/backend/${d.path}`}
                                                    alt="Diagram"
                                                    className="max-h-40 max-w-full rounded border border-neutral-400 p-0.5 object-contain"
                                                />
                                            ))}
                                        </div>
                                    ) : q.diagram_path ? (
                                        <div className="my-2 flex justify-center overflow-hidden">
                                            <img
                                                src={`/api/backend/${q.diagram_path}`}
                                                alt="Diagram"
                                                className="max-h-40 max-w-full rounded border border-neutral-400 p-0.5 object-contain"
                                            />
                                        </div>
                                    ) : null}

                                    {/* Options Grid */}
                                    <div className="mt-2 space-y-1 pl-1 text-xs break-words">
                                        {q.options.map((opt, optIdx) => {
                                            const label = getOptionLabel(optIdx);
                                            const isCorrectOption = Boolean(opt.is_correct);

                                            return (
                                                <div
                                                    key={opt.id || optIdx}
                                                    className={`flex items-start gap-1.5 py-0.5 min-w-0 ${
                                                        showAnswerKey && isCorrectOption
                                                            ? "font-bold text-emerald-800 print:text-black bg-emerald-50 print:bg-neutral-200 px-1 rounded-xs"
                                                            : ""
                                                    }`}
                                                >
                                                    <span className="font-bold shrink-0">
                                                        ({label})
                                                    </span>
                                                    <div className="flex-1 min-w-0 break-words">
                                                        <span
                                                            className="break-words [&_img]:max-w-full"
                                                            dangerouslySetInnerHTML={{
                                                                __html: sanitizeHtmlContent(opt.ans || opt.text || ""),
                                                            }}
                                                        />
                                                        {opt.diagram_path && (
                                                            <div className="mt-1 overflow-hidden">
                                                                <img
                                                                    src={`/api/backend/${opt.diagram_path}`}
                                                                    alt={`Option ${label}`}
                                                                    className="max-h-20 max-w-full rounded border border-neutral-400 p-0.5 object-contain"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {showAnswerKey && isCorrectOption && (
                                                        <span className="shrink-0 text-[10px] font-mono text-emerald-700 print:text-black font-bold">
                                                            [✓ Correct]
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── 6. Answer Key Summary Table (When Teacher Mode Enabled) ── */}
                    {showAnswerKey && (
                        <div className="mt-6 pt-4 border-t-2 border-black break-inside-avoid">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-center underline">
                                Complete Answer Key Matrix
                            </h3>
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center text-xs font-mono">
                                {questions.map((q, qIndex) => {
                                    const correctIndex = q.options.findIndex((opt) => opt.is_correct);
                                    const correctLabel = correctIndex >= 0 ? getOptionLabel(correctIndex) : "-";

                                    return (
                                        <div
                                            key={q.question_id || qIndex}
                                            className="border border-black py-1 px-0.5 bg-neutral-50 print:bg-white"
                                        >
                                            <div className="text-[10px] text-neutral-600 print:text-black">
                                                Q.{qIndex + 1}
                                            </div>
                                            <div className="font-bold text-sm">
                                                {correctLabel}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── 7. End of Paper Indicator & Rough Work ── */}
                    <footer className="mt-8 pt-4 border-t border-black text-center text-xs break-inside-avoid">
                        <p className="font-bold tracking-widest uppercase">
                            *** END OF QUESTION PAPER ***
                        </p>
                        <div className="mt-6 border-t border-dashed border-neutral-400 pt-3 text-[11px] text-neutral-500 print:text-neutral-700">
                            SPACE FOR ROUGH WORK
                        </div>
                    </footer>
                </div>
            </div>

            {/* Custom print CSS injection */}
            <style jsx global>{`
                @page {
                    size: A4 portrait;
                    margin: 10mm 12mm 12mm 12mm;
                }
                @media print {
                    html,
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        font-family: "Times New Roman", Times, Georgia, serif !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .paper-sheet {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        min-height: auto !important;
                    }
                    .question-item {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
                .paper-sheet {
                    box-sizing: border-box;
                    word-break: break-word;
                    overflow-wrap: break-word;
                }
                .paper-sheet img {
                    max-width: 100% !important;
                    height: auto !important;
                    object-fit: contain;
                }
                .paper-sheet table {
                    max-width: 100% !important;
                    table-layout: auto !important;
                    word-break: break-word !important;
                }
                .paper-sheet pre,
                .paper-sheet code {
                    white-space: pre-wrap !important;
                    word-break: break-word !important;
                    max-width: 100% !important;
                }
                .paper-sheet * {
                    box-sizing: border-box;
                }
            `}</style>
        </div>
    );
}
