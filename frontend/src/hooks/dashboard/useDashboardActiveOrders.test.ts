import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboardActiveOrders from './useDashboardActiveOrders';
import * as dashboardApi from '@/api/dashboard.api';

vi.mock('@/api/dashboard.api', () => ({
    getActiveOrders: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useDashboardActiveOrders', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockApiOrders = [
        {
            id: 1,
            customerName: 'Maria Gonzalez',
            avatarUrl: '/avatars/1.jpg',
            type: 'DINE_IN',
            tableNo: '3',
            status: 'IN_KITCHEN',
            statusVariant: 'purple',
        },
        {
            id: 2,
            customerName: 'Walk in Customer',
            avatarUrl: undefined,
            type: undefined,
            tableNo: undefined,
            status: undefined,
            statusVariant: 'secondary',
        },
    ];

    it('transforms API response into ActiveOrder[]', async () => {
        vi.mocked(dashboardApi.getActiveOrders).mockResolvedValue(mockApiOrders);

        const { result } = renderHook(() => useDashboardActiveOrders(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toHaveLength(2);
        expect(result.current.data[0]).toEqual({
            id: '1',
            customerName: 'Maria Gonzalez',
            avatarUrl: '/avatars/1.jpg',
            type: 'DINE_IN',
            tableNo: '3',
            status: 'IN_KITCHEN',
            statusVariant: 'purple',
        });
        expect(result.current.data[1]).toEqual({
            id: '2',
            customerName: 'Walk in Customer',
            avatarUrl: undefined,
            type: 'Dine In',
            tableNo: undefined,
            status: 'Unknown',
            statusVariant: 'secondary',
        });
    });

    it('uses default values for missing fields', async () => {
        vi.mocked(dashboardApi.getActiveOrders).mockResolvedValue([{
            id: 3,
            customerName: 'Test',
            statusVariant: 'warning',
        }]);

        const { result } = renderHook(() => useDashboardActiveOrders(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data[0].type).toBe('Dine In');
        expect(result.current.data[0].tableNo).toBeUndefined();
        expect(result.current.data[0].status).toBe('Unknown');
    });

    it('returns empty array on empty response', async () => {
        vi.mocked(dashboardApi.getActiveOrders).mockResolvedValue([]);

        const { result } = renderHook(() => useDashboardActiveOrders(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual([]);
    });

    it('sets isError on API failure', async () => {
        vi.mocked(dashboardApi.getActiveOrders).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useDashboardActiveOrders(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toEqual([]);
    });
});
