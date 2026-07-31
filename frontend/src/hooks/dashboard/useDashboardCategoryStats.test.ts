import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboardCategoryStats from './useDashboardCategoryStats';
import * as dashboardApi from '@/api/dashboard.api';

vi.mock('@/api/dashboard.api', () => ({
    getCategoryStats: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useDashboardCategoryStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('transforms API response into CategoryStat[]', async () => {
        const mockResponse = [
            { label: 'Take Away', icon: 'shopping-bag', color: 'primary', orders: 100 },
            { label: 'Reservation', icon: 'wine', color: 'secondary', orders: 50 },
        ];
        vi.mocked(dashboardApi.getCategoryStats).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useDashboardCategoryStats(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toHaveLength(2);
        expect(result.current.data[0]).toEqual({
            id: 'cat-stat-0',
            label: 'Take Away',
            icon: 'shopping-bag',
            color: 'primary',
            orders: 100,
        });
        expect(result.current.data[1]).toEqual({
            id: 'cat-stat-1',
            label: 'Reservation',
            icon: 'wine',
            color: 'secondary',
            orders: 50,
        });
        expect(result.current.isError).toBe(false);
    });

    it('returns empty array on empty response', async () => {
        vi.mocked(dashboardApi.getCategoryStats).mockResolvedValue([]);

        const { result } = renderHook(() => useDashboardCategoryStats(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual([]);
    });

    it('sets isError on API failure', async () => {
        vi.mocked(dashboardApi.getCategoryStats).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useDashboardCategoryStats(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toEqual([]);
    });

    it('calls API with filter params', async () => {
        vi.mocked(dashboardApi.getCategoryStats).mockResolvedValue([]);

        const filter = { fromDate: '2026-01-01', toDate: '2026-01-31' };
        renderHook(() => useDashboardCategoryStats(filter), { wrapper: createWrapper() });

        await waitFor(() => expect(dashboardApi.getCategoryStats).toHaveBeenCalledWith(filter));
    });
});
