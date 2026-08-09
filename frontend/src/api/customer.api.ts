import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/api/category.api';
import type { Option } from '@/api/item.api';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
export type CustomerStatus = 'active' | 'inactive';
export type Gender = 'male' | 'female' | 'other';

export interface CustomerEntry {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    avatarPath: string | null;
    dateOfBirth: string | null;
    gender: Gender | null;
    status: CustomerStatus;
    isWalkin: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerQuery {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    search?: string;
    status?: CustomerStatus;
}

export interface CustomerFormData {
    name: string;
    phone: string;
    email?: string;
    dateOfBirth?: string | null;
    gender?: Gender | null;
    status?: CustomerStatus;
    image?: File | null;
}

/* ------------------------------------------------------------------ */
/*  Dropdown option helper                                            */
/* ------------------------------------------------------------------ */
export const getCustomerOptions = async (): Promise<Option[]> => {
    const { data } = await api.get<ApiResponse<Option[]>>('/customers/options');
    return data.result;
};

/* ------------------------------------------------------------------ */
/*  Customer CRUD                                                     */
/* ------------------------------------------------------------------ */
export const getCustomers = async (params: CustomerQuery): Promise<PageResponse<CustomerEntry>> => {
    const { data } = await api.get<ApiResponse<PageResponse<CustomerEntry>>>('/customers', { params });
    return data.result;
};

const toFormData = (payload: CustomerFormData): FormData => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('phone', payload.phone);

    if (payload.email) formData.append('email', payload.email);
    if (payload.dateOfBirth) formData.append('dateOfBirth', payload.dateOfBirth);
    if (payload.gender) formData.append('gender', payload.gender);
    if (payload.status) formData.append('status', payload.status);
    if (payload.image) formData.append('image', payload.image);

    return formData;
};

export const createCustomer = async (payload: CustomerFormData): Promise<CustomerEntry> => {
    const { data } = await api.post<ApiResponse<CustomerEntry>>('/customers', toFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.result;
};

export const updateCustomer = async (id: number, payload: CustomerFormData): Promise<CustomerEntry> => {
    const { data } = await api.put<ApiResponse<CustomerEntry>>(`/customers/${id}`, toFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.result;
};

export const deleteCustomer = async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`);
};

