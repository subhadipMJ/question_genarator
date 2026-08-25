import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "../public/logos/safalya-logo-new-1.png";
interface LoaderProps {
    /** Size of the spinner icon */
    size?: "sm" | "md" | "lg";
    /** Optional label shown next to / below the spinner */
    label?: string;
    /** Extra classes for the wrapper */
    className?: string;
    /** Full-page centered loader with app branding */
    fullPage?: boolean;
    /** Full-screen overlay mode (blurred backdrop) */
    fullScreen?: boolean;
}

const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
};

export default function Loader({ size = "md", label, className, fullPage = false, fullScreen = false }: LoaderProps) {

    // ── Full-page branded loader ──────────────────────────────────────
    if (fullPage) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/60">
                {/* App name */}
                <div className="flex items-center gap-2 select-none">
                    <img className="h-72" src={logo.src} alt="" />
                </div>

                {/* Spinner */}
                <Loader2 className="h-8 w-8 animate-spin text-primary" />

                {/* Optional label */}
                {label && (
                    <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
                )}
            </div>
        );
    }

    // ── Full-screen blurred overlay ───────────────────────────────────
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className={cn(sizeMap[size], "animate-spin text-primary")} />
                    {label && <p className="text-sm text-muted-foreground">{label}</p>}
                </div>
            </div>
        );
    }

    // ── Inline spinner ────────────────────────────────────────────────
    return (
        <span className={cn("inline-flex items-center gap-2", className)}>
            <Loader2 className={cn(sizeMap[size], "animate-spin")} />
            {label && <span className="text-sm">{label}</span>}
        </span>
    );
}
