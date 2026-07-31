import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/api/category.api';
import type { DiscountType } from '@/types';

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

export interface QrPaymentCreateRequest {
    discountAmount: number;
    discountType: DiscountType;
    tipAmount: number;
    couponCode: string | null;
    note?: string | null;
}

export interface QrPaymentResponse {
    paymentCode: string;
    amount: number;
    qrContent: string;
}

export interface QrPaymentInfoResponse {
    paymentCode: string;
    amount: number;
    status: string;
    orderNumber: string;
    merchantName: string;
}

export interface QrPaymentConfirmRequest {
    amount: number;
}

export interface QrPaymentConfirmResponse {
    status: string;
    message?: string;
    paymentCode?: string;
    amount?: number;
    orderNumber?: string;
    merchantName?: string;
}

export const createQrPayment = async (orderId: number, payload: QrPaymentCreateRequest): Promise<QrPaymentResponse> => {
    const { data } = await api.post<ApiResponse<QrPaymentResponse>>(`/payments/create/${orderId}`, payload);
    return data.result;
};

export const getQrPaymentInfo = async (paymentCode: string): Promise<QrPaymentInfoResponse> => {
    const { data } = await api.get<ApiResponse<QrPaymentInfoResponse>>(`/payments/${paymentCode}`);
    return data.result;
};

export const confirmQrPayment = async (paymentCode: string, payload: QrPaymentConfirmRequest): Promise<QrPaymentConfirmResponse> => {
    const { data } = await api.post<QrPaymentConfirmResponse>(`/payments/${paymentCode}/confirm`, payload);
    return data;
};

export const cancelQrPayment = async (paymentCode: string): Promise<QrPaymentInfoResponse> => {
    const { data } = await api.post<ApiResponse<QrPaymentInfoResponse>>(`/payments/${paymentCode}/cancel`);
    return data.result;
};
