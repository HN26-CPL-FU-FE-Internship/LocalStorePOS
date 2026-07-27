import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useCreateCustomer from './useCreateCustomer';
import posService from '@/services/posService';
import type { OptionItem } from '@/services/posService';

// ── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/services/posService', () => ({
    default: {
        createCustomer: vi.fn(),
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

const mockCustomer: OptionItem = { id: 1, name: 'John Doe' };
const customerData = { name: 'John Doe', phone: '0123456789' };

// ── Tests ────────────────────────────────────────────────────────────────

describe('useCreateCustomer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls posService.createCustomer with the provided data', async () => {
        vi.mocked(posService.createCustomer).mockResolvedValue(mockCustomer);

        const { result } = renderHook(() => useCreateCustomer(), { wrapper: createWrapper() });

        result.current.mutate(customerData);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(posService.createCustomer).toHaveBeenCalledWith(customerData);
    });

    it('returns the created customer on success', async () => {
        vi.mocked(posService.createCustomer).mockResolvedValue(mockCustomer);

        const { result } = renderHook(() => useCreateCustomer(), { wrapper: createWrapper() });

        result.current.mutate(customerData);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockCustomer);
    });

    it('invalidates customers query cache on success', async () => {
        vi.mocked(posService.createCustomer).mockResolvedValue(mockCustomer);
        const { queryClient } = await import('@/lib');
        const { POS_QUERY_KEYS } = await import('@/constants/pos');

        const { result } = renderHook(() => useCreateCustomer(), { wrapper: createWrapper() });

        result.current.mutate(customerData);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
            queryKey: POS_QUERY_KEYS.customers(),
        });
    });

    it('handles mutation error gracefully', async () => {
        const errorMessage = 'Failed to create customer';
        vi.mocked(posService.createCustomer).mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useCreateCustomer(), { wrapper: createWrapper() });

        result.current.mutate(customerData);

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
        expect(result.current.error?.message).toBe(errorMessage);
    });
});
