import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useStartCooking from './useStartCooking';
import kitchenService from '@/services/kitchenService';

// ── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/services/kitchenService', () => ({
    default: {
        startCooking: vi.fn(),
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

const mockStartCookingData = { id: 1, estimatedMinutes: 15 };
const mockResponse = {
    id: 1,
    orderNumber: 'ORD-001',
    kitchenStatus: 'in_kitchen',
    status: 'preparing',
};

// ── Tests ────────────────────────────────────────────────────────────────

describe('useStartCooking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls kitchenService.startCooking with the provided data', async () => {
        vi.mocked(kitchenService.startCooking).mockResolvedValue(mockResponse as any);

        const { result } = renderHook(() => useStartCooking(), { wrapper: createWrapper() });

        result.current.mutate(mockStartCookingData);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(kitchenService.startCooking).toHaveBeenCalledWith(mockStartCookingData);
    });

    it('returns the order response on success', async () => {
        vi.mocked(kitchenService.startCooking).mockResolvedValue(mockResponse as any);

        const { result } = renderHook(() => useStartCooking(), { wrapper: createWrapper() });

        result.current.mutate(mockStartCookingData);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockResponse);
    });

    it('invalidates kitchen query cache on success', async () => {
        vi.mocked(kitchenService.startCooking).mockResolvedValue(mockResponse as any);
        const { queryClient } = await import('@/lib');
        const { KITCHEN_QUERY_KEYS } = await import('@/constants');

        const { result } = renderHook(() => useStartCooking(), { wrapper: createWrapper() });

        result.current.mutate(mockStartCookingData);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
            queryKey: KITCHEN_QUERY_KEYS.all,
        });
    });

    it('handles mutation error gracefully', async () => {
        const errorMessage = 'Failed to start cooking';
        vi.mocked(kitchenService.startCooking).mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useStartCooking(), { wrapper: createWrapper() });

        result.current.mutate(mockStartCookingData);

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
        expect(result.current.error?.message).toBe(errorMessage);
    });
});
