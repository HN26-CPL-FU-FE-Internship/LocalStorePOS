import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import {
    getRecentNotifications,
    getUnreadCount,
    markAsRead as markAsReadApi,
    markAllAsRead as markAllAsReadApi,
    acceptApprovalRequest,
    declineApprovalRequest,
    type NotificationResponse,
} from '@/services/api/notification.api';
import { formatRelativeTime } from '@/utils/date';
import type { NotificationGroup, BootstrapVariant } from '@/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, string> = {
    approval: 'file-check',
    order: 'shopping-cart',
    'new order': 'cooking-pot',
    kitchen: 'cooking-pot',
    payment: 'badge-dollar-sign',
    stock: 'package',
};

const VARIANT_MAP: Record<string, BootstrapVariant> = {
    approval: 'warning',
    kitchen: 'secondary',
    payment: 'success',
    stock: 'info',
};

function getIcon(title: string): string {
    const lower = title.toLowerCase();
    for (const [keyword, icon] of Object.entries(ICON_MAP)) {
        if (lower.includes(keyword)) return icon;
    }
    return 'bell';
}

function getVariant(title: string): BootstrapVariant {
    const lower = title.toLowerCase();
    for (const [keyword, variant] of Object.entries(VARIANT_MAP)) {
        if (lower.includes(keyword)) return variant;
    }
    return 'primary';
}

function isApprovalRequest(title: string): boolean {
    const lower = title.toLowerCase();
    return lower.includes('approval') || lower.includes('approve');
}

function toItemData(notification: NotificationResponse): {
    apiId: number;
    createdAt: string;
    item: import('@/types').NotificationItem;
} {
    const isApproval = isApprovalRequest(notification.title);
    return {
        apiId: notification.id,
        createdAt: notification.createdAt,
        item: {
            id: String(notification.id),
            icon: getIcon(notification.title),
            variant: getVariant(notification.title),
            message: notification.message ?? notification.title,
            time: formatRelativeTime(notification.createdAt),
            actionable: !notification.isRead,
            ...(isApproval && notification.targetType && notification.targetId
                ? {
                      actions: [
                          { label: 'Accept', variant: 'primary' as BootstrapVariant },
                          { label: 'Decline', variant: 'white' as BootstrapVariant },
                      ],
                  }
                : {}),
        },
    };
}

function groupByDate(
    items: Array<{ apiId: number; createdAt: string; item: import('@/types').NotificationItem }>,
): NotificationGroup[] {
    const today = dayjs().startOf('day');
    const yesterday = today.subtract(1, 'day');

    const todayItems = items.filter((nd) => dayjs(nd.createdAt).isAfter(today));
    const yesterdayItems = items.filter((nd) => {
        const d = dayjs(nd.createdAt);
        return d.isAfter(yesterday) && d.isBefore(today);
    });

    const groups: NotificationGroup[] = [];
    if (todayItems.length > 0) {
        groups.push({
            id: 'today',
            heading: 'Today',
            items: todayItems.map((nd) => nd.item),
        });
    }
    if (yesterdayItems.length > 0) {
        groups.push({
            id: 'yesterday',
            heading: 'Yesterday',
            items: yesterdayItems.map((nd) => nd.item),
        });
    }
    return groups;
}

/* ------------------------------------------------------------------ */
/*  Query keys                                                        */
/* ------------------------------------------------------------------ */

const NOTIFICATIONS_KEY = ['notifications'] as const;
const UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const;

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export function useNotifications() {
    const queryClient = useQueryClient();

    // ── Fetch all notifications from last 2 days (no pagination) ───
    const listQuery = useQuery({
        queryKey: [...NOTIFICATIONS_KEY, 'recent'],
        queryFn: getRecentNotifications,
        staleTime: 30_000,
    });

    // ── Unread count ───────────────────────────────────────────────
    const unreadQuery = useQuery({
        queryKey: UNREAD_COUNT_KEY,
        queryFn: getUnreadCount,
        staleTime: 15_000,
    });

    // ── Transform data ─────────────────────────────────────────────
    const allNotifications = listQuery.data ?? [];
    const allItemsData = allNotifications.map(toItemData);
    const allGroups = groupByDate(allItemsData);

    const unreadItemsData = allItemsData.filter((nd) => {
        const notif = allNotifications.find((n) => n.id === nd.apiId);
        return notif && !notif.isRead;
    });
    const unreadGroups = groupByDate(unreadItemsData);

    const unreadCount = unreadQuery.data ?? 0;

    // ── Mutations ──────────────────────────────────────────────────
    const { mutate: markAsRead } = useMutation({
        mutationFn: (id: number) => markAsReadApi(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
            queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
        },
    });

    const { mutate: markAllAsRead } = useMutation({
        mutationFn: markAllAsReadApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
            queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
        },
    });

    // Wrapper: accept — maps notificationId → targetId (approval request ID)
    const acceptMutation = useMutation({
        mutationFn: ({ requestId, reason }: { requestId: number; reason: string }) =>
            acceptApprovalRequest(requestId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
            queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
        },
    });

    const acceptAction = (notificationId: number) => {
        const notification = allNotifications.find((n) => n.id === notificationId);
        const targetId = notification?.targetId;
        if (!targetId) {
            console.warn('No targetId found for notification', notificationId);
            return;
        }
        acceptMutation.mutate({ requestId: targetId, reason: 'Approved from notification' });
    };

    // Wrapper: decline — maps notificationId → targetId (approval request ID)
    const declineMutation = useMutation({
        mutationFn: ({ requestId, reason }: { requestId: number; reason: string }) =>
            declineApprovalRequest(requestId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
            queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
        },
    });

    const declineAction = (notificationId: number) => {
        const notification = allNotifications.find((n) => n.id === notificationId);
        const targetId = notification?.targetId;
        if (!targetId) {
            console.warn('No targetId found for notification', notificationId);
            return;
        }
        declineMutation.mutate({ requestId: targetId, reason: 'Declined from notification' });
    };

    return {
        /** All notification groups (today + yesterday). */
        groups: allGroups,
        /** Only unread notification groups. */
        unreadGroups,
        /** Total unread count. */
        unreadCount,
        /** Loading state. */
        isLoading: listQuery.isLoading,
        /** Error state. */
        isError: listQuery.isError,
        /** Mark a single notification as read. */
        markAsRead,
        /** Mark all notifications as read. */
        markAllAsRead,
        /** Accept an approval request (simple action). */
        acceptAction,
        /** Decline an approval request (simple action). */
        declineAction,
    };
}
