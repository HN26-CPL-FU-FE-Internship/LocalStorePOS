import { api } from '@/lib';
import type { CouponOrder } from '@/types';
import type { ApiResponse } from '@/types/auth';

const couponService = {
    getActiveCoupons: async () => {
        const res = await api.get<ApiResponse<CouponOrder[]>>('/coupons/active');
        return res.data;
    },
};

export default couponService;
