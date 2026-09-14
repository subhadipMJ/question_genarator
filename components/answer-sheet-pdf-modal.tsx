"use client";

import { useState } from "react";
import { FileText, ExternalLink, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AnswerSheetPdfModalProps {
    isOpen?: boolean;
    pdfUrl?: string | null;
    title?: string;
    onClose: () => void;
}

export default function AnswerSheetPdfModal({
    isOpen = true,
    pdfUrl,
    title = "Answer Sheet",
    onClose,
}: AnswerSheetPdfModalProps) {
    const [isLoading, setIsLoading] = useState(true);

    if (!isOpen || !pdfUrl) return null;

    // Ensure the PDF URL is correctly formatted if it's a relative path from the backend
    const cleanPath = pdfUrl.replace(/^\//, '');
    const uploadsPath = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
    const formattedUrl = pdfUrl.startsWith('http') || pdfUrl.startsWith('data:') 
        ? pdfUrl 
        : `/api/backend/${uploadsPath}`;

    return (
        <div 
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
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
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => window.open(formattedUrl, '_blank')}
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open in New Tab
                        </Button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground cursor-pointer rounded-full p-1.5 hover:bg-accent transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body with Iframe */}
                <div className="flex-1 relative bg-muted/10 w-full h-full">
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-card z-10 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium animate-pulse">Loading PDF Document...</p>
                        </div>
                    )}
                    <iframe
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
