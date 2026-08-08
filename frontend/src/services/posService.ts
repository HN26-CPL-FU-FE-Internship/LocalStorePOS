import { api } from '@/lib';
import type { ApiResponse } from '@/types/auth';
import type { CategoryEntry } from '@/api/category.api';
import type { OrderSummary } from '@/types';
import type { PageContent, PlaceOrder, POSItem, RecentOrder } from '@/types/pos';

import type { TableShape } from '@/api/table.api';

export interface OptionItem {
    id: number;
    name: string;
}

export interface TablePOS extends OptionItem {
    seats: number;
    areaName: string;
    shape: TableShape;
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

    getTables: async (): Promise<TablePOS[]> => {
        const res = await api.get<ApiResponse<TablePOS[]>>('/pos/tables');
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

    placeOrder: async (data: PlaceOrder): Promise<OrderSummary> => {
        const res = await api.post<ApiResponse<OrderSummary>>('/pos/orders', data);
        return res.data.result;
    },

    updateOrder: async (orderNumber: string, data: PlaceOrder): Promise<OrderSummary> => {
        const res = await api.put<ApiResponse<OrderSummary>>(`/pos/orders/${orderNumber}`, data);
        return res.data.result;
    },
};

export default posService;
