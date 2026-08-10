import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import usePayOrder from './usePayOrder';
import orderService from '@/services/orderService';
import type { PaymentRequest } from '@/services/orderService';
import type { ApiResponse } from '@/types/auth';
import type { OrderSummary } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────────

const { mockShowToast } = vi.hoisted(() => ({ mockShowToast: vi.fn() }));

vi.mock('@/services/orderService', () => ({
    default: {
        payOrder: vi.fn(),
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
    message: 'Payment successful.',
    result: {} as OrderSummary,
};

const paymentData: PaymentRequest = {
    discountAmount: 0,
    discountType: 'percentage',
    tipAmount: 0,
    couponCode: null,
    paymentType: 'CASH',
    givenAmount: 100,
    note: null,
};

const axiosError = (message: string) =>
    Object.assign(new Error(message), {
        isAxiosError: true,
        response: { data: { message } },
    });

// ── Tests ────────────────────────────────────────────────────────────────

describe('usePayOrder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls orderService.payOrder with the provided id and payment data', async () => {
        vi.mocked(orderService.payOrder).mockResolvedValue(successResponse);

        const { result } = renderHook(() => usePayOrder(), { wrapper: createWrapper() });

        result.current.mutate({ id: 42, paymentData });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(orderService.payOrder).toHaveBeenCalledWith({ id: 42, paymentData });
    });

    it('toasts the backend message on success', async () => {
        vi.mocked(orderService.payOrder).mockResolvedValue(successResponse);

        const { result } = renderHook(() => usePayOrder(), { wrapper: createWrapper() });

        result.current.mutate({ id: 42, paymentData });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(mockShowToast).toHaveBeenCalledWith('success', 'Payment successful.');
    });

    it('invalidates the order query cache on success', async () => {
        vi.mocked(orderService.payOrder).mockResolvedValue(successResponse);
        const { queryClient } = await import('@/lib');
        const { orderKeys } = await import('@/constants');

        const { result } = renderHook(() => usePayOrder(), { wrapper: createWrapper() });

        result.current.mutate({ id: 42, paymentData });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: orderKeys.all });
    });

    it('toasts the backend error message when the payment fails', async () => {
        vi.mocked(orderService.payOrder).mockRejectedValue(axiosError('Insufficient balance'));

        const { result } = renderHook(() => usePayOrder(), { wrapper: createWrapper() });

        result.current.mutate({ id: 42, paymentData });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(mockShowToast).toHaveBeenCalledWith('error', 'Insufficient balance');
    });

    it('toasts the fallback message when the error has no backend payload', async () => {
        vi.mocked(orderService.payOrder).mockRejectedValue(new Error('network down'));

        const { result } = renderHook(() => usePayOrder(), { wrapper: createWrapper() });

        result.current.mutate({ id: 42, paymentData });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(mockShowToast).toHaveBeenCalledWith('error', 'Payment failed. Please try again.');
    });
});
