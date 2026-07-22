import { api } from '@/lib';
import type { ApiResponse } from '@/types/auth';
import type { CategoryEntry } from '@/api/category.api';
import type { OrderSummary } from '@/types';
import type { PageContent, POSItem, RecentOrder } from '@/types/pos';

export interface OptionItem {
    id: number;
    name: string;
}

const posService = {
    getRecentOrders: async (): Promise<PageContent<RecentOrder>> => {
        const res = await api.get<ApiResponse<PageContent<RecentOrder>>>('/pos/recent-orders');
        return res.data.result;
    },

    getMenuCategories: async (): Promise<CategoryEntry[]> => {
        const res = await api.get<ApiResponse<CategoryEntry[]>>('/categories/all');
        return res.data.result;
    },

    getMenuItems: async (categoryId: number = 0): Promise<POSItem[]> => {
        const res = await api.get<ApiResponse<POSItem[]>>('/pos/items', {
            params: { categoryId },
        });
        return res.data.result;
    },

    getWaiters: async (): Promise<OptionItem[]> => {
        const res = await api.get<ApiResponse<OptionItem[]>>('/pos/waiters');
        return res.data.result;
    },

    getCustomers: async (): Promise<OptionItem[]> => {
        const res = await api.get<ApiResponse<OptionItem[]>>('/pos/customers');
        return res.data.result;
    },

    getTables: async (): Promise<OptionItem[]> => {
        const res = await api.get<ApiResponse<OptionItem[]>>('/pos/tables');
        return res.data.result;
    },

    createCustomer: async (data: {
        name: string;
        phone: string;
        email?: string;
        gender?: 'male' | 'female' | 'other' | null;
    }): Promise<OptionItem> => {
        const res = await api.post<ApiResponse<OptionItem>>('/pos/customers', data);
        return res.data.result;
    },

    placeOrder: async (data: {
        orderType: string;
        customerId?: number | null;
        waiterId?: number | null;
        tableId?: number | null;
        subtotal: number;
        vatAmount: number;
        serviceTaxAmount: number;
        grandTotal: number;
        note?: string | null;
        items: Array<{
            itemId: number;
            variationId?: number | null;
            itemName: string;
            unitPrice: number;
            quantity: number;
            lineTotal: number;
            kitchenNote?: string | null;
            addons?: Array<{
                addonId: number;
                addonName: string;
                addonPrice: number;
            }>;
        }>;
    }): Promise<OrderSummary> => {
        const res = await api.post<ApiResponse<OrderSummary>>('/pos/orders', data);
        return res.data.result;
    },
};

export default posService;
