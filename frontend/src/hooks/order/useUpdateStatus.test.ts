import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useUpdateStatus from './useUpdateStatus';
import orderService from '@/services/orderService';
import type { ApiResponse } from '@/types/auth';
import type { OrderSummary } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────────

const { mockShowToast } = vi.hoisted(() => ({ mockShowToast: vi.fn() }));

vi.mock('@/services/orderService', () => ({
    default: {
        updateStatus: vi.fn(),
    },
}));

vi.mock('@/lib', () => ({
    queryClient: { invalidateQueries: vi.fn() },
}));

vi.mock('@/hooks/useContextData', () => ({
    default: () => ({ showToast: mockShowToast }),
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

const successResponse: ApiResponse<OrderSummary> = {
    code: 200,
    message: 'Order status updated successfully.',
    result: {} as OrderSummary,
};

const axiosError = (message: string) =>
    Object.assign(new Error(message), {
        isAxiosError: true,
        response: { data: { message } },
    });

// ── Tests ────────────────────────────────────────────────────────────────

describe('useUpdateStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls orderService.updateStatus with the provided status and id', async () => {
        vi.mocked(orderService.updateStatus).mockResolvedValue(successResponse);

        const { result } = renderHook(() => useUpdateStatus(), { wrapper: createWrapper() });

        result.current.mutate({ status: 'completed', id: 42 });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(orderService.updateStatus).toHaveBeenCalledWith({ status: 'completed', id: 42 });
    });

    it('toasts the backend message on success', async () => {
        vi.mocked(orderService.updateStatus).mockResolvedValue(successResponse);

        const { result } = renderHook(() => useUpdateStatus(), { wrapper: createWrapper() });

        result.current.mutate({ status: 'completed', id: 42 });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(mockShowToast).toHaveBeenCalledWith('success', 'Order status updated successfully.');
    });

    it('invalidates the order query cache on success', async () => {
        vi.mocked(orderService.updateStatus).mockResolvedValue(successResponse);
        const { queryClient } = await import('@/lib');
        const { orderKeys } = await import('@/constants');

        const { result } = renderHook(() => useUpdateStatus(), { wrapper: createWrapper() });

        result.current.mutate({ status: 'completed', id: 42 });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: orderKeys.all });
    });

    it('toasts the backend error message when the request fails', async () => {
        vi.mocked(orderService.updateStatus).mockRejectedValue(axiosError('Cannot cancel a paid order'));

        const { result } = renderHook(() => useUpdateStatus(), { wrapper: createWrapper() });

        result.current.mutate({ status: 'cancelled', id: 7 });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(mockShowToast).toHaveBeenCalledWith('error', 'Cannot cancel a paid order');
    });

    it('toasts the fallback message when the error has no backend payload', async () => {
        vi.mocked(orderService.updateStatus).mockRejectedValue(new Error('network down'));

        const { result } = renderHook(() => useUpdateStatus(), { wrapper: createWrapper() });

        result.current.mutate({ status: 'cancelled', id: 7 });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(mockShowToast).toHaveBeenCalledWith('error', 'Something went wrong.');
    });
});
