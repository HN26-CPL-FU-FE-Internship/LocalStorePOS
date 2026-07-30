import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboardReservations from './useDashboardReservations';
import * as dashboardApi from '@/api/dashboard.api';

vi.mock('@/api/dashboard.api', () => ({
    getDashboardReservations: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useDashboardReservations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockResponse = [
        {
            id: 1,
            day: 'Nov 08',
            year: '2026',
            customerName: 'Elijah Thoms',
            time: '10:45',
            tables: 2,
            guests: 2,
            status: 'Booked',
            statusVariant: 'success',
        },
    ];

    it('passes through API response as-is', async () => {
        vi.mocked(dashboardApi.getDashboardReservations).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useDashboardReservations(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual(mockResponse);
        expect(result.current.isError).toBe(false);
    });

    it('calls API with limit param', async () => {
        vi.mocked(dashboardApi.getDashboardReservations).mockResolvedValue([]);

        renderHook(() => useDashboardReservations(3), { wrapper: createWrapper() });

        await waitFor(() => expect(dashboardApi.getDashboardReservations).toHaveBeenCalledWith(3));
    });

    it('returns empty array on empty response', async () => {
        vi.mocked(dashboardApi.getDashboardReservations).mockResolvedValue([]);

        const { result } = renderHook(() => useDashboardReservations(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual([]);
    });

    it('sets isError on API failure', async () => {
        vi.mocked(dashboardApi.getDashboardReservations).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useDashboardReservations(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
    });
});
