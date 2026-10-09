export interface NotificationItem {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: string;
    reference_id?: number | null;
    link?: string | null;
    is_read: boolean;
    created_at: string;
    read_at?: string | null;
}

export interface NotificationListResponse {
    items: NotificationItem[];
    unread_count: number;
}

export async function fetchNotifications(unreadOnly = false): Promise<NotificationListResponse> {
    const res = await fetch(`/api/backend/notifications?unread_only=${unreadOnly}&limit=30`, {
        cache: "no-store",
    });
    if (!res.ok) {
        throw new Error("Failed to fetch notifications");
    }
    return res.json();
}

export async function fetchUnreadCount(): Promise<number> {
    const res = await fetch("/api/backend/notifications/unread-count", {
        cache: "no-store",
    });
    if (!res.ok) {
        throw new Error("Failed to fetch unread count");
    }
    const data = await res.json();
    return data.unread_count ?? 0;
}

export async function markNotificationAsRead(id: number): Promise<void> {
    const res = await fetch(`/api/backend/notifications/${id}/read`, {
        method: "PATCH",
    });
    if (!res.ok) {
        throw new Error("Failed to mark notification as read");
    }
}

export async function markAllNotificationsAsRead(): Promise<void> {
    const res = await fetch("/api/backend/notifications/read-all", {
        method: "POST",
    });
    if (!res.ok) {
        throw new Error("Failed to mark all as read");
    }
}
