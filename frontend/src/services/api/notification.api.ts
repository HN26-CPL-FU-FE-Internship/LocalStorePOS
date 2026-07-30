import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/types';

export interface NotificationResponse {
    id: number;
    title: string;
    message: string | null;
    isRead: boolean;
    userId: number | null;
    createdAt: string;
}

export interface ApprovalActionPayload {
    reason: string;
}

/**
 * Get paginated notifications for the current user.
 */
export const getNotifications = async (
    page = 0,
    size = 20,
): Promise<PageResponse<NotificationResponse>> => {
    const { data } = await api.get<ApiResponse<PageResponse<NotificationResponse>>>('/notifications', {
        params: { page, size },
    });
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
