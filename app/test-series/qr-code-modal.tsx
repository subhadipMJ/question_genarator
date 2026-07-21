"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Copy, Check, QrCode, Download } from "lucide-react";

type QRCodeModalProps = {
    isOpen: boolean;
    onClose: () => void;
    seriesName: string;
    inviteToken: string | null;
    origin?: string;
};

export default function QRCodeModal({
    isOpen,
    onClose,
    seriesName,
    inviteToken,
    origin = "",
}: QRCodeModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !inviteToken) return null;

    const currentOrigin = origin || (typeof window !== "undefined" ? window.location.origin : "");
    const inviteUrl = `${currentOrigin}/student/join#token=${inviteToken}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(inviteUrl)}`;

    function handleCopy() {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        toast.success("Invite link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    }

    function handleDownload() {
        const link = document.createElement("a");
        link.href = qrImageUrl;
        link.download = `${seriesName.replace(/\s+/g, "_")}_QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("QR Code downloaded!");
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative bg-background border rounded-xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-primary" />
                        <div>
                            <h3 className="text-base font-semibold leading-tight">Invite Link & QR Code</h3>
                            <p className="text-xs text-muted-foreground truncate max-w-[260px]">{seriesName}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full shrink-0"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col items-center text-center space-y-5">
                    <p className="text-xs text-muted-foreground max-w-sm">
                        Students can scan this QR code using their camera or phone scanner to immediately join and take this test series.
                    </p>

                    {/* QR Code Container */}
                    <div className="p-3 bg-white rounded-xl border border-border shadow-md inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={qrImageUrl}
                            alt={`QR Code for ${seriesName}`}
                            width={220}
                            height={220}
                            className="rounded-md"
                        />
                    </div>

                    {/* Invite Link Copy Box */}
                    <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                            <Input
                                value={inviteUrl}
                                readOnly
                                className="text-xs font-mono bg-muted/30 select-all"
                            />
                            <Button
                                size="sm"
                                onClick={handleCopy}
                                className="shrink-0 text-xs gap-1.5 px-3"
                            >
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? "Copied" : "Copy"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t bg-muted/30 flex items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="text-xs gap-1.5"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download QR
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-xs"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
