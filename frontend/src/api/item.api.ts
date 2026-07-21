import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/api/category.api';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
export type ItemStatus = 'active' | 'hidden' | 'inactive';
export type FoodType = 'veg' | 'non_veg' | 'egg';

export interface Option {
    id: number;
    name: string;
}

export interface ItemVariation {
    id?: number;
    sizeName: string;
    price: number;
}

export interface ItemAddon {
    id?: number;
    name: string;
    price: number;
    description?: string;
}

export interface ItemEntry {
    id: number;
    name: string;
    imagePath: string | null;
    price: number;
    netPrice: number | null;
    foodType: FoodType;
    status: ItemStatus;
    categoryId: number;
    categoryName: string;
    taxId: number | null;
    taxTitle: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ItemDetail extends ItemEntry {
    description: string;
    variations: ItemVariation[];
    addons: ItemAddon[];
}

export interface ItemQuery {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    search?: string;
    categoryId?: number;
    foodType?: FoodType;
    status?: ItemStatus;
}

export interface ItemFormData {
    name: string;
    description: string;
    price: number;
    netPrice?: number | null;
    categoryId: number;
    taxId?: number | null;
    foodType?: FoodType;
    status?: ItemStatus;
    image?: File | null;
    variations?: ItemVariation[];
    addons?: ItemAddon[];
}

/* ------------------------------------------------------------------ */
/*  Dropdown option helpers (Category / Tax)                          */
/* ------------------------------------------------------------------ */
export const getCategoryOptions = async (): Promise<Option[]> => {
    const { data } = await api.get<ApiResponse<Option[]>>('/categories/options');
    return data.result;
};

export const getTaxOptions = async (): Promise<Option[]> => {
    const { data } = await api.get<ApiResponse<Option[]>>('/taxes/options');
    return data.result;
};

/* ------------------------------------------------------------------ */
/*  Item CRUD                                                         */
/* ------------------------------------------------------------------ */
export const getItems = async (params: ItemQuery): Promise<PageResponse<ItemEntry>> => {
    const { data } = await api.get<ApiResponse<PageResponse<ItemEntry>>>('/items', { params });
    return data.result;
};

export const getItem = async (id: number): Promise<ItemDetail> => {
    const { data } = await api.get<ApiResponse<ItemDetail>>(`/items/${id}`);
    return data.result;
};

const toFormData = (payload: ItemFormData): FormData => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('description', payload.description);
    formData.append('price', String(payload.price));

    if (payload.netPrice !== undefined && payload.netPrice !== null) {
        formData.append('netPrice', String(payload.netPrice));
    }

    formData.append('categoryId', String(payload.categoryId));

    if (payload.taxId) {
        formData.append('taxId', String(payload.taxId));
    }

    if (payload.foodType) {
        formData.append('foodType', payload.foodType);
    }

    if (payload.status) {
        formData.append('status', payload.status);
    }

    if (payload.image) {
        formData.append('image', payload.image);
    }

    if (payload.variations) {
        formData.append(
            'variations',
            JSON.stringify(payload.variations.filter((v) => v.sizeName.trim() !== '')),
        );
    }

    if (payload.addons) {
        formData.append(
            'addons',
            JSON.stringify(payload.addons.filter((a) => a.name.trim() !== '')),
        );
    }

    return formData;
};

export const createItem = async (payload: ItemFormData): Promise<ItemDetail> => {
    const { data } = await api.post<ApiResponse<ItemDetail>>('/items', toFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.result;
};

export const updateItem = async (id: number, payload: ItemFormData): Promise<ItemDetail> => {
    const { data } = await api.put<ApiResponse<ItemDetail>>(`/items/${id}`, toFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.result;
};

export const updateItemStatus = async (id: number, status: ItemStatus): Promise<ItemDetail> => {
    const { data } = await api.patch<ApiResponse<ItemDetail>>(`/items/${id}/status`, null, {
        params: { status },
    });
    return data.result;
};

export const deleteItem = async (id: number): Promise<void> => {
    await api.delete(`/items/${id}`);
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
export const getItemImageUrl = (imagePath: string | null): string | undefined => {
    if (!imagePath) return undefined;
    if (imagePath.startsWith('http')) return imagePath;

    const base = api.defaults.baseURL?.replace(/\/api\/?$/, '') ?? '';
    return `${base}${imagePath}`;
};
