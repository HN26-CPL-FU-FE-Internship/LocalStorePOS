import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';

export interface NotificationResponse {
    id: number;
    title: string;
    message: string | null;
    isRead: boolean;
    userId: number | null;
    createdAt: string;
    targetType: string | null;
    targetId: number | null;
}

/**
 * Backend PageResponse uses `items` instead of `content`.
 */
/**
 * Get all notifications from the last 2 days (no pagination).
 */
export const getRecentNotifications = async (): Promise<NotificationResponse[]> => {
    const { data } = await api.get<ApiResponse<NotificationResponse[]>>('/notifications/recent');
    return data.result;
};

/**
 * Get unread notification count.
 */
export const getUnreadCount = async (): Promise<number> => {
    const { data } = await api.get<ApiResponse<number>>('/notifications/unread-count');
    return data.result;
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (id: number): Promise<NotificationResponse> => {
    const { data } = await api.put<ApiResponse<NotificationResponse>>(`/notifications/${id}/read`);
    return data.result;
};

/**
 * Mark a single notification as unread.
 */
export const markAsUnread = async (id: number): Promise<NotificationResponse> => {
    const { data } = await api.put<ApiResponse<NotificationResponse>>(`/notifications/${id}/unread`);
    return data.result;
};

/**
 * Mark all notifications as read for the current user.
 */
export const markAllAsRead = async (): Promise<number> => {
    const { data } = await api.put<ApiResponse<number>>('/notifications/read-all');
    return data.result;
};

/**
 * Accept an approval request (simple action from notification).
 */
export const acceptApprovalRequest = async (
    requestId: number,
    reason: string,
): Promise<unknown> => {
    const { data } = await api.post<ApiResponse<unknown>>(
        `/notifications/approval-requests/${requestId}/accept`,
        { reason },
    );
    return data.result;
};

/**
 * Decline an approval request (simple action from notification).
 */
export const declineApprovalRequest = async (
    requestId: number,
    reason: string,
): Promise<unknown> => {
    const { data } = await api.post<ApiResponse<unknown>>(
        `/notifications/approval-requests/${requestId}/decline`,
        { reason },
    );
    return data.result;
};
