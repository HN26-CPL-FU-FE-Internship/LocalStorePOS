import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboardTrendingMenus from './useDashboardTrendingMenus';
import * as dashboardApi from '@/api/dashboard.api';

vi.mock('@/api/dashboard.api', () => ({
    getTrendingMenus: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useDashboardTrendingMenus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockResponse = [
        { id: 1, name: 'Grilled Chicken', imageUrl: '/img/menu-01.jpg', orders: 48, dietType: 'Non Veg' },
        { id: 2, name: 'Corn Pizza', imageUrl: '/img/menu-04.jpg', orders: 69, dietType: 'Veg' },
    ];

    it('transforms API response into TrendingMenu[]', async () => {
        vi.mocked(dashboardApi.getTrendingMenus).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useDashboardTrendingMenus(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toHaveLength(2);
        expect(result.current.data[0]).toEqual({
            id: '1',
            name: 'Grilled Chicken',
            imageUrl: '/img/menu-01.jpg',
            orders: 48,
            dietType: 'Non Veg',
        });
        expect(result.current.data[1]).toEqual({
            id: '2',
            name: 'Corn Pizza',
            imageUrl: '/img/menu-04.jpg',
            orders: 69,
            dietType: 'Veg',
        });
    });

    it('handles missing imageUrl gracefully', async () => {
        vi.mocked(dashboardApi.getTrendingMenus).mockResolvedValue([
            { id: 3, name: 'Test', imageUrl: undefined, orders: 10, dietType: 'Veg' },
        ]);

        const { result } = renderHook(() => useDashboardTrendingMenus(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data[0].imageUrl).toBe('');
    });

    it('returns empty array on empty response', async () => {
        vi.mocked(dashboardApi.getTrendingMenus).mockResolvedValue([]);

        const { result } = renderHook(() => useDashboardTrendingMenus(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual([]);
    });

    it('sets isError on API failure', async () => {
        vi.mocked(dashboardApi.getTrendingMenus).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useDashboardTrendingMenus(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toEqual([]);
    });
});
