/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useMarkKitchenDelayed from './useMarkKitchenDelayed';
import kitchenService from '@/services/kitchenService';

// ── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/services/kitchenService', () => ({
    default: {
        markKitchenDelayed: vi.fn(),
    },
}));

vi.mock('@/lib', () => ({
    queryClient: { invalidateQueries: vi.fn() },
}));

// ── Helpers ──────────────────────────────────────────────────────────────

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

const mockOrderId = 1;
const mockResponse = {
    id: 1,
    orderNumber: 'ORD-001',
    kitchenStatus: 'delayed',
    status: 'preparing',
};

// ── Tests ────────────────────────────────────────────────────────────────

describe('useMarkKitchenDelayed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls kitchenService.markKitchenDelayed with the order id', async () => {
        vi.mocked(kitchenService.markKitchenDelayed).mockResolvedValue(mockResponse as any);

        const { result } = renderHook(() => useMarkKitchenDelayed(), { wrapper: createWrapper() });

        result.current.mutate(mockOrderId);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(kitchenService.markKitchenDelayed).toHaveBeenCalledWith(mockOrderId);
    });

    it('returns the order response on success', async () => {
        vi.mocked(kitchenService.markKitchenDelayed).mockResolvedValue(mockResponse as any);

        const { result } = renderHook(() => useMarkKitchenDelayed(), { wrapper: createWrapper() });

        result.current.mutate(mockOrderId);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockResponse);
    });

    it('invalidates kitchen query cache on success', async () => {
        vi.mocked(kitchenService.markKitchenDelayed).mockResolvedValue(mockResponse as any);
        const { queryClient } = await import('@/lib');
        const { KITCHEN_QUERY_KEYS } = await import('@/constants');

        const { result } = renderHook(() => useMarkKitchenDelayed(), { wrapper: createWrapper() });

        result.current.mutate(mockOrderId);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
            queryKey: KITCHEN_QUERY_KEYS.all,
        });
    });

    it('handles mutation error gracefully', async () => {
        const errorMessage = 'Failed to mark order as delayed';
        vi.mocked(kitchenService.markKitchenDelayed).mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useMarkKitchenDelayed(), { wrapper: createWrapper() });

        result.current.mutate(mockOrderId);

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
        expect(result.current.error?.message).toBe(errorMessage);
    });
});
