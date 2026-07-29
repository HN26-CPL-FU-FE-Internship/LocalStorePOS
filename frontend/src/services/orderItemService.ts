import { api } from '@/lib';
import type { ApiResponse } from '@/types/auth';
import type { OrderItem } from '@/types/order';

const orderItemService = {
    updateOrderItemStatus: async (data: { id: number; status: string }) => {
        const res = await api.patch<ApiResponse<OrderItem>>(`/order-items/${data.id}`, {
            status: data.status,
        });
        return res.data;
    },
};

export default orderItemService;
