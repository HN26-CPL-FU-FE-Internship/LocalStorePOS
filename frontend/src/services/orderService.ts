import { api } from '@/lib';
import type { OrderStat, OrderSummary, PageResponse, Time } from '@/types';
import type { ApiResponse } from '@/types/auth';
import type { OrderQuery } from '@/types';

import type { DiscountType } from '@/types';

export interface PaymentRequest {
    discountAmount: number;
    discountType: DiscountType;
    tipAmount: number;
    couponCode: string | null;
    paymentType: string;
    givenAmount: number;
    note: string | null;
}

const orderService = {
    getOrderStats: async (query: Time) => {
        const res = await api.get<ApiResponse<OrderStat>>('/orders/stats', {
            params: query,
        });
        return res.data;
    },

    getOrderSummary: async (query: OrderQuery) => {
        const res = await api.get<ApiResponse<PageResponse<OrderSummary>>>('/orders/order-list', {
            params: query,
        });
        return res.data;
    },

    updateStatus: async ({ status, id }: { status: string; id: number }) => {
        const res = await api.patch<ApiResponse<OrderSummary>>(`/orders/${id}/status`, {
            status,
        });
        return res.data;
    },

    payOrder: async ({ id, paymentData }: { id: number; paymentData: PaymentRequest }) => {
        const res = await api.post<ApiResponse<OrderSummary>>(`/orders/${id}/pay`, paymentData);
        return res.data;
    },
};

export default orderService;
