import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';

export type TaxTypeValue = 'inclusive' | 'exclusive';
export type TaxStatusValue = 'active' | 'inactive';

export interface TaxEntry {
    id: number;
    title: string;
    taxRate: number;
    taxType: TaxTypeValue | string;
    status: TaxStatusValue | string;
    createdAt: string;
    updatedAt: string;
}

export interface TaxFormData {
    title: string;
    taxRate: number;
    taxType: TaxTypeValue;
    status?: TaxStatusValue;
}

export const getTaxes = async (): Promise<TaxEntry[]> => {
    const { data } = await api.get<ApiResponse<TaxEntry[]>>('/taxes');
    return data.result;
};

export const getTax = async (id: number): Promise<TaxEntry> => {
    const { data } = await api.get<ApiResponse<TaxEntry>>(`/taxes/${id}`);
    return data.result;
};

export const createTax = async (payload: TaxFormData): Promise<TaxEntry> => {
    const { data } = await api.post<ApiResponse<TaxEntry>>('/taxes', payload);
    return data.result;
};

export const updateTax = async (id: number, payload: TaxFormData): Promise<TaxEntry> => {
    const { data } = await api.put<ApiResponse<TaxEntry>>(`/taxes/${id}`, payload);
    return data.result;
};

export const updateTaxStatus = async (id: number, status: TaxStatusValue): Promise<TaxEntry> => {
    const { data } = await api.patch<ApiResponse<TaxEntry>>(`/taxes/${id}/status`, null, {
        params: { status },
    });
    return data.result;
};

export const deleteTax = async (id: number): Promise<void> => {
    await api.delete(`/taxes/${id}`);
};
