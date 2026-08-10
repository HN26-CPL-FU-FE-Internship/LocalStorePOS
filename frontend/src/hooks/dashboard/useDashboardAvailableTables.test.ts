/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboardAvailableTables from './useDashboardAvailableTables';
import tableImages from '@/assets/img/tables';
import * as dashboardApi from '@/api/dashboard.api';

vi.mock('@/api/dashboard.api', () => ({
    getAvailableTables: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useDashboardAvailableTables', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('transforms API response into TableAvailability[]', async () => {
        const mockResponse = [
            { id: 1, name: 'Table 01', guests: 6, imageUrl: '/tables/01.svg' },
            { id: 2, name: 'Table 02', guests: 4, imageUrl: null },
        ];
        vi.mocked(dashboardApi.getAvailableTables).mockResolvedValue(mockResponse as any);

        const { result } = renderHook(() => useDashboardAvailableTables(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toHaveLength(2);
        expect(result.current.data[0]).toEqual({
            id: '1',
            name: 'Table 01',
            guests: 6,
            imageUrl: '/tables/01.svg',
        });
        const fallback = result.current.data[1].imageUrl;
        expect(fallback).toBe(tableImages['tables-17']);
        // Asset must resolve to a real URL string (catches broken imports/keys).
        expect(typeof fallback).toBe('string');
        expect(fallback!.length).toBeGreaterThan(0);
    });

    it('uses default image URL when imageUrl is missing', async () => {
        vi.mocked(dashboardApi.getAvailableTables).mockResolvedValue([{ id: 3, name: 'Table 03', guests: 2 }] as any);

        const { result } = renderHook(() => useDashboardAvailableTables(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const fallback = result.current.data[0].imageUrl;
        expect(fallback).toBe(tableImages['tables-17']);
        // Asset must resolve to a real URL string (catches broken imports/keys).
        expect(typeof fallback).toBe('string');
        expect(fallback!.length).toBeGreaterThan(0);
    });

    it('returns empty array on empty response', async () => {
        vi.mocked(dashboardApi.getAvailableTables).mockResolvedValue([]);

        const { result } = renderHook(() => useDashboardAvailableTables(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toEqual([]);
    });

    it('sets isError on API failure', async () => {
        vi.mocked(dashboardApi.getAvailableTables).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useDashboardAvailableTables(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toEqual([]);
    });
});
