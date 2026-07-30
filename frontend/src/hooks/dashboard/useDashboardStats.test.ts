import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboardStats from './useDashboardStats';
import * as dashboardApi from '@/api/dashboard.api';

vi.mock('@/api/dashboard.api', () => ({
    getDashboardStats: vi.fn(),
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

describe('useDashboardStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockStats = {
        totalOrders: 6986,
        totalSales: 7516.5,
        averageOrderValue: 25.36,
        totalReservations: 496,
    };

    const mockSalesPerf = [
        { label: 'Total Orders', value: '6986', change: '+12.5%', icon: 'shopping-bag', color: 'indigo' },
        { label: 'Total Sales', value: '$7516.50', change: '+8.3%', icon: 'shield-check', color: 'success' },
    ];

    it('transforms stats into StatCardData[]', async () => {
        vi.mocked(dashboardApi.getDashboardStats).mockResolvedValue(mockStats);
        vi.mocked(dashboardApi.getSalesPerformance).mockResolvedValue(mockSalesPerf);

        const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toHaveLength(4);
        expect(result.current.data[0]).toMatchObject({
            id: 'total-orders',
            label: 'Total Orders',
            icon: 'box',
            color: 'purple',
        });
        expect(result.current.data[0].change).toEqual({ value: '+12.5%', trend: 'up' });

        expect(result.current.data[1]).toMatchObject({
            id: 'total-sales',
            label: 'Total Sales',
            icon: 'badge-dollar-sign',
            color: 'primary',
        });
        expect(result.current.data[1].change).toEqual({ value: '+8.3%', trend: 'up' });

        expect(result.current.data[2]).toMatchObject({
            id: 'average-value',
            label: 'Average Value',
            icon: 'diamond-percent',
            color: 'orange',
        });

        expect(result.current.data[3]).toMatchObject({
            id: 'reservations',
            label: 'Reservations',
            icon: 'calendar-fold',
            color: 'success',
        });
    });

    it('formats sales and average values with $', async () => {
        vi.mocked(dashboardApi.getDashboardStats).mockResolvedValue(mockStats);
        vi.mocked(dashboardApi.getSalesPerformance).mockResolvedValue(mockSalesPerf);

        const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data[1].value).toContain('$');
        expect(result.current.data[2].value).toContain('$');
        expect(result.current.data[0].value).not.toContain('$');
    });

    it('uses default change values when sales performance data is empty', async () => {
        vi.mocked(dashboardApi.getDashboardStats).mockResolvedValue(mockStats);
        vi.mocked(dashboardApi.getSalesPerformance).mockResolvedValue([]);

        const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data[0].change.value).toBe('0%');
        expect(result.current.data[1].change.trend).toBe('down');
    });

    it('returns empty array when stats are still loading', async () => {
        vi.mocked(dashboardApi.getDashboardStats).mockResolvedValue(mockStats);
        vi.mocked(dashboardApi.getSalesPerformance).mockResolvedValue(mockSalesPerf);

        const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toEqual([]);
    });

    it('sets isError when either API fails', async () => {
        vi.mocked(dashboardApi.getDashboardStats).mockRejectedValue(new Error('Stats error'));
        vi.mocked(dashboardApi.getSalesPerformance).mockResolvedValue(mockSalesPerf);

        const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
