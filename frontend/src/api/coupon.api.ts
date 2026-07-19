import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/api/category.api';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
export type CouponStatus = 'active' | 'inactive' | 'expired';
export type DiscountType = 'percentage' | 'fixed_amount';

export interface CouponEntry {
    id: number;
    code: string;
    categoryIds: number[];
    categoryNames: string[];
    discountType: DiscountType;
    discountAmount: number;
    startDate: string;
    expiryDate: string;
    status: CouponStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CouponQuery {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    search?: string;
    status?: CouponStatus;
}

export interface CouponFormData {
    code: string;
    categoryIds: number[];
    discountType: DiscountType;
    discountAmount: number;
    startDate: string;
    expiryDate: string;
    status?: CouponStatus;
}

/* ------------------------------------------------------------------ */
/*  Coupon CRUD                                                       */
/* ------------------------------------------------------------------ */
export const getCoupons = async (params: CouponQuery): Promise<PageResponse<CouponEntry>> => {
    const { data } = await api.get<ApiResponse<PageResponse<CouponEntry>>>('/coupons', { params });
    return data.result;
};

export const createCoupon = async (payload: CouponFormData): Promise<CouponEntry> => {
    const { data } = await api.post<ApiResponse<CouponEntry>>('/coupons', payload);
    return data.result;
};

export const updateCoupon = async (id: number, payload: CouponFormData): Promise<CouponEntry> => {
    const { data } = await api.put<ApiResponse<CouponEntry>>(`/coupons/${id}`, payload);
    return data.result;
};

export const updateCouponStatus = async (id: number, status: CouponStatus): Promise<CouponEntry> => {
    const { data } = await api.patch<ApiResponse<CouponEntry>>(`/coupons/${id}/status`, null, {
        params: { status },
    });
    return data.result;
};

export const deleteCoupon = async (id: number): Promise<void> => {
    await api.delete(`/coupons/${id}`);
};
