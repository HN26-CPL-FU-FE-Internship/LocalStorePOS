import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboardRevenueChart from './useDashboardRevenueChart';
import * as dashboardApi from '@/api/dashboard.api';

vi.mock('@/api/dashboard.api', () => ({
    getRevenueChart: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useDashboardRevenueChart', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('computes totalRevenue from chart data points', async () => {
        const mockData = [
            { label: '01 Jan', value: 100 },
            { label: '02 Jan', value: 250.5 },
            { label: '03 Jan', value: 49.5 },
        ];
        vi.mocked(dashboardApi.getRevenueChart).mockResolvedValue(mockData);

        const { result } = renderHook(() => useDashboardRevenueChart(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual(mockData);
        expect(result.current.totalRevenue).toBe('$400.00'); // 100 + 250.5 + 49.5
    });

    it('returns $0.00 for empty chart data', async () => {
        vi.mocked(dashboardApi.getRevenueChart).mockResolvedValue([]);

        const { result } = renderHook(() => useDashboardRevenueChart(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual([]);
        expect(result.current.totalRevenue).toBe('$0.00');
    });

    it('handles single data point', async () => {
        vi.mocked(dashboardApi.getRevenueChart).mockResolvedValue([{ label: '01 Jan', value: 500 }]);

        const { result } = renderHook(() => useDashboardRevenueChart(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.totalRevenue).toBe('$500.00');
    });

    it('sets isError on API failure', async () => {
        vi.mocked(dashboardApi.getRevenueChart).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useDashboardRevenueChart(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.totalRevenue).toBe('$0.00');
        expect(result.current.data).toEqual([]);
    });
});
