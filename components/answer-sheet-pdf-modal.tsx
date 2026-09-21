"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, ExternalLink, X, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface AnswerSheetPdfModalProps {
    isOpen?: boolean;
    pdfUrl?: string | null;
    title?: string;
    isAdmin?: boolean;
    onClose: () => void;
    onDelete?: () => Promise<void>;
    onReplace?: (newFile: File) => Promise<string | void>;
}

export default function AnswerSheetPdfModal({
    isOpen = true,
    pdfUrl,
    title = "Answer Sheet",
    isAdmin = false,
    onClose,
    onDelete,
    onReplace,
}: AnswerSheetPdfModalProps) {
    const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null | undefined>(pdfUrl);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReplacing, setIsReplacing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentPdfUrl(pdfUrl);
        setIsLoading(true);
    }, [pdfUrl]);

    if (!isOpen || !currentPdfUrl) return null;

    // Ensure the PDF URL is correctly formatted if it's a relative path from the backend
    const cleanPath = currentPdfUrl.replace(/^\//, '');
    const uploadsPath = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
    const formattedUrl = currentPdfUrl.startsWith('http') || currentPdfUrl.startsWith('data:') 
        ? currentPdfUrl 
        : `/api/backend/${uploadsPath}`;

    const handleDelete = async () => {
        if (!onDelete) return;
        const confirmed = window.confirm("Are you sure? This will remove the PDF answer sheet but keep results published.");
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            await onDelete();
            toast.success("Answer sheet PDF deleted successfully.");
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete answer sheet PDF");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReplaceClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Please select a valid PDF file.");
            return;
        }

        if (!onReplace) return;

        setIsReplacing(true);
        setIsLoading(true);
        try {
            const newUrl = await onReplace(file);
            if (typeof newUrl === "string" && newUrl) {
                setCurrentPdfUrl(newUrl);
            }
            toast.success("Answer sheet PDF replaced successfully.");
        } catch (err: any) {
            toast.error(err.message || "Failed to replace answer sheet PDF");
            setIsLoading(false);
        } finally {
            setIsReplacing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const isBusy = isDeleting || isReplacing;

    return (
        <div 
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
            onClick={isBusy ? undefined : onClose}
        >
            <div 
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 shrink-0">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold">{title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Hidden file input for Replace action */}
                        {isAdmin && (
                            <input
                                type="file"
                                accept="application/pdf"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        )}

                        {/* Admin Action Controls */}
                        {isAdmin && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isBusy}
                                    onClick={handleReplaceClick}
                                    className="h-8 gap-1.5 text-xs font-medium cursor-pointer hover:bg-accent"
                                    title="Upload a new PDF to replace the current answer key"
                                >
                                    {isReplacing ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    )}
                                    Replace
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isBusy}
                                    onClick={handleDelete}
                                    className="h-8 gap-1.5 text-xs font-medium border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                    title="Delete answer sheet PDF"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                    Delete
                                </Button>
                            </>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs cursor-pointer"
                            onClick={() => window.open(formattedUrl, '_blank')}
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open in New Tab
                        </Button>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isBusy}
                            className="text-muted-foreground hover:text-foreground cursor-pointer rounded-full p-1.5 hover:bg-accent transition-colors disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body with Iframe */}
                <div className="flex-1 relative bg-muted/10 w-full h-full">
                    {(isLoading || isReplacing || isDeleting) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-card z-10 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium animate-pulse">
                                {isDeleting
                                    ? "Deleting PDF Document..."
                                    : isReplacing
                                    ? "Uploading & Replacing PDF..."
                                    : "Loading PDF Document..."}
                            </p>
                        </div>
                    )}
                    <iframe
                        key={formattedUrl}
                        src={`${formattedUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                        className="w-full h-full border-0"
                        title={title}
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                    />
                </div>
            </div>
        </div>
    );
}
