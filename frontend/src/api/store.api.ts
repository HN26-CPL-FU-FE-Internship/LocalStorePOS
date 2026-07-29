import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';

export interface StoreSetting {
    id: number;
    name: string;
    imagePath: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
    email: string | null;
    phone: string | null;
    currencyCode: string;
    timezone: string;
    enableQrMenu: boolean | null;
    enableTakeaway: boolean | null;
    enableDineIn: boolean | null;
    enableReservation: boolean | null;
    enableOrderViaQr: boolean | null;
    enableDelivery: boolean | null;
    enableTable: boolean | null;
    createdAt: string;
    updatedAt: string;
}

export interface StoreSettingFormData {
    name: string;
    image?: File | null;
    addressLine1: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    email?: string;
    phone?: string;
    currencyCode: string;
    timezone?: string;
    enableQrMenu?: boolean;
    enableTakeaway?: boolean;
    enableDineIn?: boolean;
    enableReservation?: boolean;
    enableOrderViaQr?: boolean;
    enableDelivery?: boolean;
    enableTable?: boolean;
}

const toFormData = (payload: StoreSettingFormData): FormData => {
    const fd = new FormData();
    fd.append('name', payload.name);
    fd.append('addressLine1', payload.addressLine1);
    if (payload.addressLine2) fd.append('addressLine2', payload.addressLine2);
    if (payload.city) fd.append('city', payload.city);
    if (payload.state) fd.append('state', payload.state);
    if (payload.country) fd.append('country', payload.country);
    if (payload.postalCode) fd.append('postalCode', payload.postalCode);
    if (payload.email) fd.append('email', payload.email);
    if (payload.phone) fd.append('phone', payload.phone);
    fd.append('currencyCode', payload.currencyCode);
    if (payload.timezone) fd.append('timezone', payload.timezone);
    if (payload.enableQrMenu !== undefined) fd.append('enableQrMenu', String(payload.enableQrMenu));
    if (payload.enableTakeaway !== undefined) fd.append('enableTakeaway', String(payload.enableTakeaway));
    if (payload.enableDineIn !== undefined) fd.append('enableDineIn', String(payload.enableDineIn));
    if (payload.enableReservation !== undefined) fd.append('enableReservation', String(payload.enableReservation));
    if (payload.enableOrderViaQr !== undefined) fd.append('enableOrderViaQr', String(payload.enableOrderViaQr));
    if (payload.enableDelivery !== undefined) fd.append('enableDelivery', String(payload.enableDelivery));
    if (payload.enableTable !== undefined) fd.append('enableTable', String(payload.enableTable));
    if (payload.image) fd.append('image', payload.image);
    return fd;
};

export const getStoreSetting = async (): Promise<StoreSetting> => {
    const { data } = await api.get<ApiResponse<StoreSetting>>('/stores/current');
    return data.result;
};

export const updateStoreSetting = async (payload: StoreSettingFormData): Promise<StoreSetting> => {
    const { data } = await api.put<ApiResponse<StoreSetting>>('/stores/current', toFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.result;
};

export const getStoreImageUrl = (imagePath: string | null): string | undefined => {
    if (!imagePath) return undefined;
    if (imagePath.startsWith('http')) return imagePath;
    const base = api.defaults.baseURL?.replace(/\/api\/?$/, '') ?? '';
    return `${base}${imagePath}`;
};
