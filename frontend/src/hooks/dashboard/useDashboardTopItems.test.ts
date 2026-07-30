import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboardTopItems from './useDashboardTopItems';
import * as dashboardApi from '@/api/dashboard.api';

vi.mock('@/api/dashboard.api', () => ({
    getTopSellingItems: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useDashboardTopItems', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockItems = [
        { rank: 1, name: 'Veggie Supreme Pizza', imageUrl: '/img/pizza.jpg', orders: 520 },
        { rank: 2, name: 'Chicken Taco', imageUrl: undefined, orders: 250 },
        { rank: 3, name: 'Grilled Chicken', imageUrl: '/img/chicken.jpg', orders: 175 },
    ];

    it('computes progressPercent relative to max orders', async () => {
        vi.mocked(dashboardApi.getTopSellingItems).mockResolvedValue(mockItems);

        const { result } = renderHook(() => useDashboardTopItems(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // max = 520
        const items = result.current.data;
        expect(items[0].progressPercent).toBe(100); // 520/520
        expect(items[1].progressPercent).toBe(48);  // 250/520 ≈ 48%
        expect(items[2].progressPercent).toBe(34);  // 175/520 ≈ 34%
    });

    it('assigns color based on index', async () => {
        vi.mocked(dashboardApi.getTopSellingItems).mockResolvedValue(mockItems);

        const { result } = renderHook(() => useDashboardTopItems(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data[0].color).toBe('primary');
        expect(result.current.data[1].color).toBe('primary');
        expect(result.current.data[2].color).toBe('secondary');
    });

    it('generates highlightText from top item', async () => {
        vi.mocked(dashboardApi.getTopSellingItems).mockResolvedValue(mockItems);

        const { result } = renderHook(() => useDashboardTopItems(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.highlightText).toBe('Most Ordered : Veggie Supreme Pizza');
    });

    it('returns empty highlightText when no items', async () => {
        vi.mocked(dashboardApi.getTopSellingItems).mockResolvedValue([]);

        const { result } = renderHook(() => useDashboardTopItems(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual([]);
        expect(result.current.highlightText).toBe('');
    });

    it('handles single item gracefully', async () => {
        vi.mocked(dashboardApi.getTopSellingItems).mockResolvedValue([mockItems[0]]);

        const { result } = renderHook(() => useDashboardTopItems(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toHaveLength(1);
        expect(result.current.data[0].progressPercent).toBe(100);
        expect(result.current.data[0].color).toBe('primary');
    });

    it('sets isError on API failure', async () => {
        vi.mocked(dashboardApi.getTopSellingItems).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useDashboardTopItems(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toEqual([]);
    });
});
