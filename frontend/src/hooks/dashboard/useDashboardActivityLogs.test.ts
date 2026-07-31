import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboardActivityLogs from './useDashboardActivityLogs';
import * as dashboardApi from '@/api/dashboard.api';

vi.mock('@/api/dashboard.api', () => ({
    getRecentActivityLogs: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useDashboardActivityLogs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockResponse = [
        {
            heading: 'Today',
            items: [
                { id: 'l1', icon: 'cooking-pot', color: 'primary', message: 'New order from Table #12', time: '20 min ago' },
            ],
        },
    ];

    it('passes through API response as-is', async () => {
        vi.mocked(dashboardApi.getRecentActivityLogs).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useDashboardActivityLogs(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual(mockResponse);
        expect(result.current.isError).toBe(false);
    });

    it('calls API with filter and limit', async () => {
        vi.mocked(dashboardApi.getRecentActivityLogs).mockResolvedValue([]);

        const filter = { fromDate: '2026-01-01', toDate: '2026-01-31' };
        renderHook(() => useDashboardActivityLogs(filter, 10), { wrapper: createWrapper() });

        await waitFor(() => expect(dashboardApi.getRecentActivityLogs).toHaveBeenCalledWith(filter, 10));
    });

    it('returns empty array on empty response', async () => {
        vi.mocked(dashboardApi.getRecentActivityLogs).mockResolvedValue([]);

        const { result } = renderHook(() => useDashboardActivityLogs(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual([]);
    });

    it('sets isError on API failure', async () => {
        vi.mocked(dashboardApi.getRecentActivityLogs).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useDashboardActivityLogs(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
    });
});
