import { api } from '@/lib';
import type { ApiResponse } from '@/types/auth';
import type { KitchenOrderStat } from '@/types/kitchen';

const kitchenService = {
    getKitchenStats: async () => {
        const res = await api.get<ApiResponse<KitchenOrderStat>>('/kitchen/stats');
        return res.data;
    },
};

export default kitchenService;
