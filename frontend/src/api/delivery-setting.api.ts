import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';

export type DeliveryChargeTypeValue = 'free' | 'fixed' | 'km_based';

export interface DeliverySetting {
    id: number;
    deliveryChargeType: DeliveryChargeTypeValue | string;
    fixedCharge: number | null;
    chargePerKm: number | null;
    minDistanceForFreeKm: number | null;
    maxDeliveryDistanceKm: number | null;
    freeDeliveryOver: number | null;
    minDeliveryOver: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface DeliverySettingFormData {
    deliveryChargeType: DeliveryChargeTypeValue;
    fixedCharge?: number;
    chargePerKm?: number;
    minDistanceForFreeKm?: number;
    maxDeliveryDistanceKm?: number;
    freeDeliveryOver?: number;
    minDeliveryOver?: number;
}

export const getDeliverySetting = async (): Promise<DeliverySetting> => {
    const { data } = await api.get<ApiResponse<DeliverySetting>>('/delivery-settings/current');
    return data.result;
};

export const updateDeliverySetting = async (payload: DeliverySettingFormData): Promise<DeliverySetting> => {
    const { data } = await api.put<ApiResponse<DeliverySetting>>('/delivery-settings/current', payload);
    return data.result;
};
