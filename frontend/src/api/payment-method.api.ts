import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';

export interface PaymentMethod {
    id: number;
    code: string;
    name: string;
    isEnabled: boolean;
    configJson: string | null;
    createdAt: string;
    updatedAt: string;
}

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    const { data } = await api.get<ApiResponse<PaymentMethod[]>>('/payment-methods');
    return data.result;
};

export const togglePaymentMethod = async (id: number): Promise<PaymentMethod> => {
    const { data } = await api.patch<ApiResponse<PaymentMethod>>(`/payment-methods/${id}/toggle`);
    return data.result;
};
