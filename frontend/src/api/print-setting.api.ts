import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';

export interface PrintSetting {
    id: number;
    enablePrint: boolean;
    showStoreDetails: boolean;
    showCustomerDetails: boolean;
    showNotes: boolean;
    printTokens: boolean;
    pageSize: string;
    headerText: string | null;
    footerText: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PrintSettingFormData {
    enablePrint?: boolean;
    showStoreDetails?: boolean;
    showCustomerDetails?: boolean;
    showNotes?: boolean;
    printTokens?: boolean;
    pageSize?: string;
    headerText?: string;
    footerText?: string;
}

export const getPrintSetting = async (): Promise<PrintSetting> => {
    const { data } = await api.get<ApiResponse<PrintSetting>>('/print-settings/current');
    return data.result;
};

export const updatePrintSetting = async (payload: PrintSettingFormData): Promise<PrintSetting> => {
    const { data } = await api.put<ApiResponse<PrintSetting>>('/print-settings/current', payload);
    return data.result;
};
