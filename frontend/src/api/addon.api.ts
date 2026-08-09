import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/api/category.api';
import type { Option } from '@/api/item.api';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
export type AddonStatus = 'active' | 'inactive';

export interface AddonEntry {
    id: number;
    itemId: number;
    itemName: string;
    name: string;
    price: number;
    description: string;
    imagePath: string | null;
    status: AddonStatus;
    createdAt: string;
    updatedAt: string;
}

export interface AddonQuery {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    search?: string;
    itemId?: number;
    status?: AddonStatus;
}

export interface AddonFormData {
    itemId: number;
    name: string;
    price: number;
    description: string;
    status?: AddonStatus;
    image?: File | null;
}

/* ------------------------------------------------------------------ */
/*  Dropdown option helper (Item)                                     */
/* ------------------------------------------------------------------ */
export const getItemOptions = async (): Promise<Option[]> => {
    const { data } = await api.get<ApiResponse<Option[]>>('/items/options');
    return data.result;
};

/* ------------------------------------------------------------------ */
/*  Addon CRUD                                                        */
/* ------------------------------------------------------------------ */
export const getAddons = async (params: AddonQuery): Promise<PageResponse<AddonEntry>> => {
    const { data } = await api.get<ApiResponse<PageResponse<AddonEntry>>>('/addons', { params });
    return data.result;
};

const toFormData = (payload: AddonFormData): FormData => {
    const formData = new FormData();
    formData.append('itemId', String(payload.itemId));
    formData.append('name', payload.name);
    formData.append('price', String(payload.price));
    formData.append('description', payload.description);

    if (payload.status) {
        formData.append('status', payload.status);
    }

    if (payload.image) {
        formData.append('image', payload.image);
    }

    return formData;
};

export const createAddon = async (payload: AddonFormData): Promise<AddonEntry> => {
    const { data } = await api.post<ApiResponse<AddonEntry>>('/addons', toFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.result;
};

export const updateAddon = async (id: number, payload: AddonFormData): Promise<AddonEntry> => {
    const { data } = await api.put<ApiResponse<AddonEntry>>(`/addons/${id}`, toFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.result;
};

export const updateAddonStatus = async (id: number, status: AddonStatus): Promise<AddonEntry> => {
    const { data } = await api.patch<ApiResponse<AddonEntry>>(`/addons/${id}/status`, null, {
        params: { status },
    });
    return data.result;
};

export const deleteAddon = async (id: number): Promise<void> => {
    await api.delete(`/addons/${id}`);
};

