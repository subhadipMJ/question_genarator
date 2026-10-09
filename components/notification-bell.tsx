"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Award, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    type NotificationItem,
} from "@/app/services/notifications";

// Exactly 1 minute (60 seconds) polling interval as requested
const POLL_INTERVAL_MS = 60 * 1000;

function formatRelativeTime(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffSec = Math.max(0, Math.floor(diffMs / 1000));
        if (diffSec < 60) return "Just now";
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return `${diffHour}h ago`;
        const diffDays = Math.floor(diffHour / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
        return "";
    }
}

export default function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    // Track known IDs so we can alert only on new notifications
    const knownIdsRef = useRef<Set<number>>(new Set());
    const isFirstLoadRef = useRef(true);

    const loadNotifications = useCallback(async (isPolling = false) => {
        try {
            if (!isPolling) setIsLoading(true);
            const data = await fetchNotifications(false);
            const items = data.items || [];
            setNotifications(items);
            setUnreadCount(data.unread_count ?? 0);

            // Check for new notifications during polling
            if (!isFirstLoadRef.current && isPolling) {
                const newUnreadItems = items.filter(
                    (item) => !knownIdsRef.current.has(item.id) && !item.is_read
                );

                for (const newNotif of newUnreadItems) {
                    toast.info(newNotif.message, {
                        description: "Your exam result has been published! Click to view.",
                        action: {
                            label: "View Result",
                            onClick: () => {
                                router.push(newNotif.link || "/student/history");
                            },
                        },
                        duration: 8000,
                    });
                }
            }

            // Update known IDs
            items.forEach((item) => knownIdsRef.current.add(item.id));
            isFirstLoadRef.current = false;
        } catch (err) {
            // Silently handle background poll network failures
            if (!isPolling) {
                console.error("Failed to fetch notifications:", err);
            }
        } finally {
            if (!isPolling) setIsLoading(false);
        }
    }, [router]);

    // Initial load + 1 minute (60s) polling
    useEffect(() => {
        void loadNotifications(false);

        const timer = setInterval(() => {
            void loadNotifications(true);
        }, POLL_INTERVAL_MS);

        return () => clearInterval(timer);
    }, [loadNotifications]);

    const handleItemClick = async (notif: NotificationItem) => {
        if (!notif.is_read) {
            try {
                await markNotificationAsRead(notif.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (err) {
                console.error("Failed to mark notification as read:", err);
            }
        }

        setIsOpen(false);
        if (notif.link) {
            router.push(notif.link);
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0 || isMarkingAll) return;
        setIsMarkingAll(true);
        try {
            await markAllNotificationsAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch (err) {
            toast.error("Failed to mark notifications as read");
        } finally {
            setIsMarkingAll(false);
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer transition-colors outline-none border-0 bg-transparent p-0"
                aria-label={`Notifications (${unreadCount} unread)`}
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
                side="bottom"
                align="end"
                className="w-80 sm:w-96 p-0 bg-popover text-popover-foreground rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Bell className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-foreground">Notifications</h3>
                            <p className="text-[10px] text-muted-foreground">
                                Polled every 1 min • {unreadCount} unread
                            </p>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={handleMarkAllRead}
                            disabled={isMarkingAll}
                            className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer px-2"
                        >
                            {isMarkingAll ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <CheckCheck className="h-3 w-3" />
                            )}
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-xs">Checking notifications…</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-muted-foreground space-y-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-semibold text-foreground">No notifications yet</p>
                            <p className="text-[11px] text-muted-foreground max-w-[220px]">
                                When an exam result is published, you will receive an alert here.
                            </p>
                        </div>
                    ) : (
                        notifications.map((notif) => {
                            const isExam = notif.type === "exam_result";
                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => void handleItemClick(notif)}
                                    className={`flex items-start gap-3 p-3.5 text-xs transition-colors cursor-pointer hover:bg-muted/50 ${
                                        !notif.is_read
                                            ? "bg-primary/5 font-medium border-l-2 border-l-primary"
                                            : "opacity-85"
                                    }`}
                                >
                                    <div
                                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                                            isExam
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "bg-primary/10 text-primary"
                                        }`}
                                    >
                                        <Award className="h-4 w-4" />
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="font-semibold text-foreground text-xs truncate">
                                                {notif.title}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                                                {formatRelativeTime(notif.created_at)}
                                            </span>
                                        </div>

                                        <p className="text-xs text-foreground/90 leading-snug break-words">
                                            {notif.message}
                                        </p>

                                        <div className="flex items-center gap-2 pt-0.5">
                                            <Badge
                                                variant="outline"
                                                className={`text-[9px] py-0 px-1.5 h-4 ${
                                                    isExam
                                                        ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                                                        : ""
                                                }`}
                                            >
                                                Result Out
                                            </Badge>
                                            <span className="text-[10px] text-primary flex items-center gap-0.5 hover:underline">
                                                View <ExternalLink className="h-2.5 w-2.5" />
                                            </span>
                                            {!notif.is_read && (
                                                <span className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-2 border-t bg-muted/20 text-center">
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                            setIsOpen(false);
                            router.push("/student/history");
                        }}
                        className="w-full text-[11px] text-muted-foreground hover:text-foreground cursor-pointer h-7"
                    >
                        View all attempts in Student History →
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
