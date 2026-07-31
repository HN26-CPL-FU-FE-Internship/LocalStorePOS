import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/api/category.api';

export type PaymentStatus = 'success' | 'pending' | 'failed' | 'refunded';

export interface PaymentEntry {
    id: number;
    transactionId: string;
    orderId: number;
    orderNumber: string;
    tokenNo: string | null;
    customerId: number | null;
    customerName: string;
    customerAvatarPath: string | null;
    orderType: string;
    itemCount: number;
    grandTotal: number;
    paymentMethodName: string;
    status: PaymentStatus;
    paidAt: string;
}

export interface PaymentQuery {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    search?: string;
    status?: PaymentStatus;
}

export const getPayments = async (params: PaymentQuery): Promise<PageResponse<PaymentEntry>> => {
    const { data } = await api.get<ApiResponse<PageResponse<PaymentEntry>>>('/payments', { params });
    return data.result;
};
