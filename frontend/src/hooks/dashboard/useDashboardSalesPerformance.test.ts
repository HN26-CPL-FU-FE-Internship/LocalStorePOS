import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboardSalesPerformance from './useDashboardSalesPerformance';
import * as dashboardApi from '@/api/dashboard.api';

vi.mock('@/api/dashboard.api', () => ({
    getSalesPerformance: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useDashboardSalesPerformance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('transforms API response into SalesSummaryItem[]', async () => {
        const mockResponse = [
            { label: 'Total Orders', value: '6589', change: '+6%', icon: 'shopping-bag', color: 'indigo' },
            { label: 'Total Sales', value: '$56589', change: '+12%', icon: 'shield-check', color: 'success' },
        ];
        vi.mocked(dashboardApi.getSalesPerformance).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useDashboardSalesPerformance(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toHaveLength(2);
        expect(result.current.data[0]).toEqual({
            id: 'perf-total-orders',
            label: 'Total Orders',
            value: '6589',
            change: '+6%',
            icon: 'shopping-bag',
            color: 'indigo',
        });
        expect(result.current.data[1]).toEqual({
            id: 'perf-total-sales',
            label: 'Total Sales',
            value: '$56589',
            change: '+12%',
            icon: 'shield-check',
            color: 'success',
        });
    });

    it('returns empty array on empty response', async () => {
        vi.mocked(dashboardApi.getSalesPerformance).mockResolvedValue([]);

        const { result } = renderHook(() => useDashboardSalesPerformance(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual([]);
    });

    it('sets isError on API failure', async () => {
        vi.mocked(dashboardApi.getSalesPerformance).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useDashboardSalesPerformance(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toEqual([]);
    });
});
