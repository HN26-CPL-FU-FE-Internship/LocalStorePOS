import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';

export interface NotificationSetting {
    id: number;
    mobilePushEnabled: boolean;
    desktopEnabled: boolean;
    paymentPush: boolean;
    paymentSms: boolean;
    paymentEmail: boolean;
    transactionPush: boolean;
    transactionSms: boolean;
    transactionEmail: boolean;
    activityPush: boolean;
    activitySms: boolean;
    activityEmail: boolean;
    accountPush: boolean;
    accountSms: boolean;
    accountEmail: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationSettingFormData {
    mobilePushEnabled?: boolean;
    desktopEnabled?: boolean;
    paymentPush?: boolean;
    paymentSms?: boolean;
    paymentEmail?: boolean;
    transactionPush?: boolean;
    transactionSms?: boolean;
    transactionEmail?: boolean;
    activityPush?: boolean;
    activitySms?: boolean;
    activityEmail?: boolean;
    accountPush?: boolean;
    accountSms?: boolean;
    accountEmail?: boolean;
}

export const getNotificationSetting = async (): Promise<NotificationSetting> => {
    const { data } = await api.get<ApiResponse<NotificationSetting>>('/notification-settings/current');
    return data.result;
};

export const updateNotificationSetting = async (payload: NotificationSettingFormData): Promise<NotificationSetting> => {
    const { data } = await api.put<ApiResponse<NotificationSetting>>('/notification-settings/current', payload);
    return data.result;
};
