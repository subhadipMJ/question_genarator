"use client";

import { useState, useRef } from "react";
import { X, UploadCloud, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PublishResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    seriesId: number;
    onPublish: () => Promise<void>; // the function that publishes results, returning a promise to await
    onPdfUploaded?: (pdfKey: string | null) => void;
}

export default function PublishResultsModal({
    isOpen,
    onClose,
    seriesId,
    onPublish,
    onPdfUploaded,
}: PublishResultsModalProps) {
    const [step, setStep] = useState<"decision" | "upload">("decision");
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    async function handlePublishWithoutPdf() {
        setIsUploading(true);
        try {
            if (onPdfUploaded) {
                onPdfUploaded(null);
            }
            await onPublish();
            onClose();
        } catch (error) {
            // Error is handled in the parent's onPublish
        } finally {
            setIsUploading(false);
        }
    }

    async function handleUploadAndPublish() {
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            // TODO: Update this URL to the exact endpoint provided by backend
            const uploadRes = await fetch(`/api/backend/test-series/${seriesId}/result-sheet`, {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to upload PDF");
            }

            // After successful upload, publish the results
            if (onPdfUploaded) {
                onPdfUploaded(`uploads/results/series_${seriesId}/result.pdf`);
            }
            await onPublish();
            onClose();
            toast.success("Result sheet PDF uploaded successfully.");
        } catch (error: any) {
            toast.error(error.message || "Failed to upload result sheet");
        } finally {
            setIsUploading(false);
        }
    }

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && droppedFile.type === "application/pdf") {
            setFile(droppedFile);
        } else {
            toast.error("Please select a valid PDF file.");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
        } else if (selectedFile) {
            toast.error("Please select a valid PDF file.");
        }
    };

    // Reset state when closing or going back
    const handleClose = () => {
        if (isUploading) return;
        setStep("decision");
        setFile(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                    <h3 className="text-lg font-bold">Publish Results</h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isUploading}
                        className="text-muted-foreground hover:text-foreground cursor-pointer rounded-full p-1 hover:bg-accent transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {step === "decision" ? (
                        <>
                            <div className="flex gap-3 mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300">
                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <strong>Do you want to add a result sheet PDF?</strong>
                                    <p className="mt-1 opacity-90 text-xs">
                                        You can optionally attach a PDF containing the detailed result sheet before publishing to students.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={handlePublishWithoutPdf}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                                    ) : (
                                        "No, just publish"
                                    )}
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => setStep("upload")}
                                    disabled={isUploading}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    Yes, add PDF
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            {!file ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                                        isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                                    }`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="mx-auto h-12 w-12 text-muted-foreground bg-muted rounded-full flex items-center justify-center mb-4">
                                        <UploadCloud className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium mb-1">Click or drag PDF to upload</p>
                                    <p className="text-xs text-muted-foreground">PDF (MAX. 10MB)</p>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                    />
                                </div>
                            ) : (
                                <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-primary/10 text-primary rounded">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFile(null)}
                                        disabled={isUploading}
                                        className="h-8 w-8 p-0 shrink-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setStep("decision");
                                        setFile(null);
                                    }}
                                    disabled={isUploading}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleUploadAndPublish}
                                    disabled={!file || isUploading}
                                >
                                    {isUploading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                                    ) : (
                                        "Upload & Publish"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
