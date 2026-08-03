import { api } from '@/lib';
import type { OrderSummary } from '@/types';
import type { ApiResponse } from '@/types/auth';
import type { KitchenOrderStat } from '@/types/kitchen';

interface KitchenOrdersResponse {
    content: OrderSummary[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

const kitchenService = {
    getKitchenStats: async () => {
        const res = await api.get<ApiResponse<KitchenOrderStat>>('/kitchen/stats');
        return res.data;
    },

    getKitchenOrder: async (page: number, size: number, search: string = '', kitchenStatus: string = '') => {
        const res = await api.get<ApiResponse<KitchenOrdersResponse>>('/kitchen/orders', {
            params: {
                page,
                size,
                search: search || undefined,
                kitchenStatus: kitchenStatus || undefined,
            },
        });
        return res.data;
    },

    startCooking: async ({ id, estimatedMinutes }: { id: number; estimatedMinutes: number }) => {
        const res = await api.post<ApiResponse<OrderSummary>>(`/kitchen/${id}/start-cooking`, { estimatedMinutes });
        return res.data;
    },

    markKitchenComplete: async (id: number) => {
        const res = await api.patch<ApiResponse<OrderSummary>>(`/kitchen/${id}/complete`);
        return res.data;
    },

    markKitchenDelayed: async (id: number) => {
        const res = await api.patch<ApiResponse<OrderSummary>>(`/kitchen/${id}/delay`);
        return res.data;
    },
};

export default kitchenService;
