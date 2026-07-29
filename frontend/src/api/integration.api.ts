import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';

export interface IntegrationEntry {
    id: number;
    providerCode: string;
    providerName: string;
    isConnected: boolean;
    configJson: string | null;
    createdAt: string;
    updatedAt: string;
}

export const getIntegrations = async (): Promise<IntegrationEntry[]> => {
    const { data } = await api.get<ApiResponse<IntegrationEntry[]>>('/integrations');
    return data.result;
};

export const toggleIntegration = async (id: number): Promise<IntegrationEntry> => {
    const { data } = await api.patch<ApiResponse<IntegrationEntry>>(`/integrations/${id}/toggle`);
    return data.result;
};
