import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type ApprovalRequestType =
    | 'CANCEL_INVOICE'
    | 'REFUND_RETURN'
    | 'DISCOUNT_EXCEEDS_THRESHOLD'
    | 'COMPLIMENTARY'
    | 'REOPEN_PAID_INVOICE'
    | 'CANCEL_ITEM_AFTER_KITCHEN'
    | 'CANCEL_KITCHEN_TICKET'
    | 'PRICE_CHANGE'
    | 'PERMISSION_CHANGE'
    | 'USER_CREATE_DELETE'
    | 'DELETE_IMPORTANT_DATA';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalRequestEntry {
    id: number;
    requestType: ApprovalRequestType;
    status: ApprovalStatus;
    description: string;
    reason: string;
    rejectionReason: string | null;
    targetType: string | null;
    targetId: number | null;
    targetDisplay: string | null;
    oldValue: string | null;
    newValue: string | null;
    additionalData: string | null;
    resolvedAt: string | null;
    createdAt: string;
    updatedAt: string;

    requestedById: number;
    requestedByName: string;
    requestedByEmail: string;

    approvedById: number | null;
    approvedByName: string | null;
    approvedByEmail: string | null;
}

export interface ApprovalPageResponse {
    items: ApprovalRequestEntry[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export interface ApprovalActionPayload {
    requestId: number;
    reason: string;
}

export interface CreateApprovalRequestPayload {
    requestType: ApprovalRequestType;
    description: string;
    reason: string;
    targetType?: string | null;
    targetId?: number | null;
    targetDisplay?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    additionalData?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Labels / helpers                                                  */
/* ------------------------------------------------------------------ */

export const approvalTypeLabels: Record<ApprovalRequestType, string> = {
    CANCEL_INVOICE: 'Hủy hóa đơn',
    REFUND_RETURN: 'Refund / Return',
    DISCOUNT_EXCEEDS_THRESHOLD: 'Discount vượt ngưỡng (>=20%)',
    COMPLIMENTARY: 'Complimentary (tặng món)',
    REOPEN_PAID_INVOICE: 'Mở lại hóa đơn đã thanh toán',
    CANCEL_ITEM_AFTER_KITCHEN: 'Hủy món sau khi đã gửi bếp',
    CANCEL_KITCHEN_TICKET: 'Hủy ticket bếp đã bắt đầu chế biến',
    PRICE_CHANGE: 'Thay đổi giá',
    PERMISSION_CHANGE: 'Thay đổi quyền (Role/Permission)',
    USER_CREATE_DELETE: 'Tạo hoặc xóa user',
    DELETE_IMPORTANT_DATA: 'Xóa dữ liệu quan trọng',
};

export const approvalTypeBadgeColors: Record<ApprovalRequestType, string> = {
    CANCEL_INVOICE: 'danger',
    REFUND_RETURN: 'warning',
    DISCOUNT_EXCEEDS_THRESHOLD: 'warning',
    COMPLIMENTARY: 'info',
    REOPEN_PAID_INVOICE: 'secondary',
    CANCEL_ITEM_AFTER_KITCHEN: 'danger',
    CANCEL_KITCHEN_TICKET: 'danger',
    PRICE_CHANGE: 'primary',
    PERMISSION_CHANGE: 'secondary',
    USER_CREATE_DELETE: 'primary',
    DELETE_IMPORTANT_DATA: 'danger',
};

/* ------------------------------------------------------------------ */
/*  API functions                                                     */
/* ------------------------------------------------------------------ */

const ENDPOINT = '/approval-requests';

export async function createApprovalRequest(payload: CreateApprovalRequestPayload): Promise<ApprovalRequestEntry> {
    const { data } = await api.post<ApiResponse<ApprovalRequestEntry>>(ENDPOINT, payload);
    return data.result;
}

export async function getApprovalRequests(params: {
    page?: number;
    size?: number;
    status?: ApprovalStatus;
    requestType?: ApprovalRequestType;
}): Promise<ApprovalPageResponse> {
    const queryParams: Record<string, string | number | undefined> = {
        page: params.page ?? 0,
        size: params.size ?? 20,
        status: params.status || undefined,
        requestType: params.requestType || undefined,
    };
    Object.keys(queryParams).forEach((key) => {
        if (queryParams[key] === undefined) {
            delete queryParams[key];
        }
    });
    const { data } = await api.get<ApiResponse<ApprovalPageResponse>>(ENDPOINT, { params: queryParams });
    return data.result;
}

export async function getApprovalRequestById(id: number): Promise<ApprovalRequestEntry> {
    const { data } = await api.get<ApiResponse<ApprovalRequestEntry>>(`${ENDPOINT}/${id}`);
    return data.result;
}

export async function approveApprovalRequest(id: number, reason: string): Promise<ApprovalRequestEntry> {
    const { data } = await api.post<ApiResponse<ApprovalRequestEntry>>(`${ENDPOINT}/${id}/approve`, {
        requestId: id,
        reason,
    });
    return data.result;
}

export async function rejectApprovalRequest(id: number, reason: string): Promise<ApprovalRequestEntry> {
    const { data } = await api.post<ApiResponse<ApprovalRequestEntry>>(`${ENDPOINT}/${id}/reject`, {
        requestId: id,
        reason,
    });
    return data.result;
}

export async function getPendingApprovalCount(): Promise<number> {
    const { data } = await api.get<ApiResponse<number>>(`${ENDPOINT}/pending-count`);
    return data.result;
}
