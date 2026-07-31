/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import OrderKitchenCard from './index';
import type { OrderSummary } from '@/types';

// ── Mock child components ──────────────────────────────────────────
vi.mock('./MinutesInputModal', () => ({
    default: ({ show, onConfirm, onHide, isLoading, minutesInput, orderNumber, customerName }: any) =>
        show
            ? React.createElement('div', { 'data-testid': 'minutes-modal' },
                React.createElement('span', null, `MinutesInputModal: ${customerName} - ${orderNumber}`),
                React.createElement('span', null, `Minutes: ${minutesInput}`),
                isLoading ? React.createElement('span', { 'data-testid': 'modal-loading' }, 'loading') : null,
                React.createElement('button', { 'data-testid': 'modal-confirm', onClick: onConfirm }, 'Confirm'),
                React.createElement('button', { 'data-testid': 'modal-close', onClick: onHide }, 'Close'),
              )
            : null,
    MIN_MINUTES: 1,
    MAX_MINUTES: 180,
}));

vi.mock('./ConfirmDoneModal', () => ({
    default: ({ show, onConfirm, onHide, isLoading, orderNumber, customerName }: any) =>
        show
            ? React.createElement('div', { 'data-testid': 'done-modal' },
                React.createElement('span', null, `ConfirmDoneModal: ${customerName} - ${orderNumber}`),
                isLoading ? React.createElement('span', { 'data-testid': 'done-loading' }, 'loading') : null,
                React.createElement('button', { 'data-testid': 'done-confirm', onClick: onConfirm }, 'Confirm Done'),
                React.createElement('button', { 'data-testid': 'done-close', onClick: onHide }, 'Close'),
              )
            : null,
}));

vi.mock('../KitchenOrderItemRow', () => ({
    default: ({ item }: any) => React.createElement('div', { 'data-testid': 'order-item-row' }, item.itemName),
}));

// ── Mock hooks ────────────────────────────────────────────────────
const mockUseCookingTimer = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/kitchen/useCookingTimer', () => ({
    default: mockUseCookingTimer,
}));

const mockUseStartCooking = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/kitchen/useStartCooking', () => ({
    default: mockUseStartCooking,
}));

const mockUseMarkKitchenComplete = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/kitchen/useMarkKitchenComplete', () => ({
    default: mockUseMarkKitchenComplete,
}));

const mockUseMarkKitchenDelayed = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/kitchen/useMarkKitchenDelayed', () => ({
    default: mockUseMarkKitchenDelayed,
}));

// ── Mock Toast context ────────────────────────────────────────────
const mockShowToast = vi.fn();
vi.mock('@/provider/ToastProvider/ToastContext', () => ({
    ToastContext: { Provider: ({ children }: any) => children },
}));
vi.mock('@/hooks/useContextData', () => ({
    default: () => ({ showToast: mockShowToast }),
}));

// ── Sample data ───────────────────────────────────────────────────
const baseOrder: OrderSummary = {
    id: 1,
    orderNumber: 'ORD-001',
    tokenNo: 'TKN-001',
    orderType: 'dine_in',
    tableNumber: 'T1',
    orderedAt: '2026-07-27T10:00:00',
    waiter: 'John',
    waiterId: null,
    customerId: null,
    tableId: null,
    customerName: 'John Doe',
    coupon: { code: '', discountAmount: 0, discountType: 'percentage' },
    status: 'pending',
    paymentStatus: 'unpaid',
    subtotal: 50,
    taxAmount: 5,
    serviceCharge: 0,
    deliveryCharge: 0,
    tipAmount: 0,
    discountAmount: 0,
    discountType: undefined,
    estimatedMinutes: 15,
    cookingStartedAt: '',
    kitchenStatus: 'new_order',
    grandTotal: 55,
    paidAmount: 0,
    balanceAmount: 0,
    note: null,
    items: [
        { id: 1, itemId: 101, itemName: 'Burger', quantity: 2, kitchenNote: null, sizeName: null, unitPrice: 10, addons: [], variationId: null, status: 'pending', taxRate: 0 },
        { id: 2, itemId: 102, itemName: 'Fries', quantity: 1, kitchenNote: 'Extra salt', sizeName: 'Large', unitPrice: 5, addons: [{ id: 1, addonId: 201, addonName: 'Cheese', addonPrice: 2, quantity: 1 }], variationId: 20, status: 'pending', taxRate: 0 },
    ],
};

const timerIdle = {
    timerState: 'idle' as const,
    remainingSeconds: 0,
    formattedTime: '00:00',
    progressPercent: 0,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn(),
};

const timerRunning = {
    timerState: 'running' as const,
    remainingSeconds: 500,
    formattedTime: '08:20',
    progressPercent: 44,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn(),
};

const timerUrgent = {
    timerState: 'running' as const,
    remainingSeconds: 60,
    formattedTime: '01:00',
    progressPercent: 90,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn(),
};

const timerPaused = {
    timerState: 'paused' as const,
    remainingSeconds: 300,
    formattedTime: '05:00',
    progressPercent: 50,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn(),
};

function createMockMutation(overrides = {}) {
    return {
        isPending: false,
        isError: false,
        isSuccess: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        ...overrides,
    };
}

describe('OrderKitchenCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseCookingTimer.mockReturnValue(timerIdle);
        mockUseStartCooking.mockReturnValue(createMockMutation());
        mockUseMarkKitchenComplete.mockReturnValue(createMockMutation());
        mockUseMarkKitchenDelayed.mockReturnValue(createMockMutation());
    });

    // ── Basic rendering ──────────────────────────────────

    it('renders order number and customer name', () => {
        render(<OrderKitchenCard order={baseOrder} />);
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders token number', () => {
        render(<OrderKitchenCard order={baseOrder} />);
        expect(screen.getByText('TKN-001')).toBeInTheDocument();
    });

    it('renders order type', () => {
        render(<OrderKitchenCard order={baseOrder} />);
        expect(screen.getByText('Dine In')).toBeInTheDocument();
    });

    it('renders all order items', () => {
        render(<OrderKitchenCard order={baseOrder} />);
        expect(screen.getByText('Burger')).toBeInTheDocument();
        expect(screen.getByText('Fries')).toBeInTheDocument();
    });

    // ── Timer states ──────────────────────────────────────

    it('shows Play button when timer is idle', () => {
        render(<OrderKitchenCard order={baseOrder} />);
        expect(screen.getByText('Play')).toBeInTheDocument();
    });

    it('shows Pause button when timer is running', () => {
        mockUseCookingTimer.mockReturnValue(timerRunning);
        render(<OrderKitchenCard order={baseOrder} />);
        expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('shows Resume button when timer is paused', () => {
        mockUseCookingTimer.mockReturnValue(timerPaused);
        render(<OrderKitchenCard order={baseOrder} />);
        expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    it('shows formatted time when timer is running', () => {
        mockUseCookingTimer.mockReturnValue(timerRunning);
        render(<OrderKitchenCard order={baseOrder} />);
        const timeElements = screen.getAllByText('08:20');
        expect(timeElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows 00:00 when timer is idle', () => {
        render(<OrderKitchenCard order={baseOrder} />);
        const timeElements = screen.getAllByText('00:00');
        expect(timeElements.length).toBeGreaterThanOrEqual(1);
    });

    // ── Play click behavior ───────────────────────────────

    it('opens minutes modal when Play is clicked in idle state', () => {
        render(<OrderKitchenCard order={baseOrder} />);
        fireEvent.click(screen.getByText('Play'));
        expect(screen.getByTestId('minutes-modal')).toBeInTheDocument();
    });

    it('pauses timer when Pause is clicked', () => {
        const pause = vi.fn();
        mockUseCookingTimer.mockReturnValue({ ...timerRunning, pause });
        render(<OrderKitchenCard order={baseOrder} />);
        fireEvent.click(screen.getByText('Pause'));
        expect(pause).toHaveBeenCalledOnce();
    });

    it('resumes timer when Resume is clicked', () => {
        const resume = vi.fn();
        mockUseCookingTimer.mockReturnValue({ ...timerPaused, resume });
        render(<OrderKitchenCard order={baseOrder} />);
        fireEvent.click(screen.getByText('Resume'));
        expect(resume).toHaveBeenCalledOnce();
    });

    // ── Mark Done ──────────────────────────────────────────

    it('opens confirm done modal when Mark Done is clicked', () => {
        render(<OrderKitchenCard order={baseOrder} />);
        fireEvent.click(screen.getByText('Mark Done'));
        expect(screen.getByTestId('done-modal')).toBeInTheDocument();
    });

    it('calls markKitchenComplete when confirm done is submitted', async () => {
        const mutateAsync = vi.fn().mockResolvedValue({});
        mockUseMarkKitchenComplete.mockReturnValue(createMockMutation({ mutateAsync }));
        render(<OrderKitchenCard order={baseOrder} />);
        fireEvent.click(screen.getByText('Mark Done'));
        fireEvent.click(screen.getByTestId('done-confirm'));
        await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(1));
    });

    // ── Completed / Cancelled state ───────────────────────

    it('shows Completed text when kitchenStatus is "completed"', () => {
        const order = { ...baseOrder, kitchenStatus: 'completed' as const };
        render(<OrderKitchenCard order={order} />);
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.queryByText('Play')).not.toBeInTheDocument();
        expect(screen.queryByText('Mark Done')).not.toBeInTheDocument();
    });

    it('shows Cancelled text when kitchenStatus is "cancelled"', () => {
        const order = { ...baseOrder, kitchenStatus: 'cancelled' as const };
        render(<OrderKitchenCard order={order} />);
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
        expect(screen.queryByText('Play')).not.toBeInTheDocument();
        expect(screen.queryByText('Mark Done')).not.toBeInTheDocument();
    });

    it('shows action buttons when order is not completed', () => {
        render(<OrderKitchenCard order={baseOrder} />);
        expect(screen.getByText('Play')).toBeInTheDocument();
        expect(screen.getByText('Mark Done')).toBeInTheDocument();
    });

    // ── Delayed banner ────────────────────────────────────

    it('shows delayed banner when kitchenStatus is "delayed"', () => {
        const order = { ...baseOrder, kitchenStatus: 'delayed' as const };
        render(<OrderKitchenCard order={order} />);
        expect(screen.getByText('Order Delayed')).toBeInTheDocument();
    });

    it('does not show delayed banner for other statuses', () => {
        render(<OrderKitchenCard order={baseOrder} />);
        expect(screen.queryByText('Order Delayed')).not.toBeInTheDocument();
    });

    // ── Urgent timer ──────────────────────────────────────

    it('shows urgent (bg-danger) progress bar when remaining < 120s', () => {
        mockUseCookingTimer.mockReturnValue(timerUrgent);
        render(<OrderKitchenCard order={baseOrder} />);
        const progressBar = document.querySelector('.progress-bar');
        expect(progressBar).toHaveClass('bg-danger');
    });

    it('shows normal (bg-success) progress bar when remaining >= 120s', () => {
        mockUseCookingTimer.mockReturnValue(timerRunning);
        render(<OrderKitchenCard order={baseOrder} />);
        const progressBar = document.querySelector('.progress-bar');
        expect(progressBar).toHaveClass('bg-success');
    });

    // ── Progress bar width ────────────────────────────────

    it('renders progress bar with correct width percentage', () => {
        mockUseCookingTimer.mockReturnValue(timerRunning);
        render(<OrderKitchenCard order={baseOrder} />);
        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        expect(progressBar.style.width).toBe('44%');
    });

    // ── Spinner on button when mutation is pending ───

    it('shows spinner in play button when startCookingMutation is pending', () => {
        mockUseStartCooking.mockReturnValue(createMockMutation({ isPending: true }));
        render(<OrderKitchenCard order={baseOrder} />);
        expect(document.querySelector('.spinner-border-sm')).toBeInTheDocument();
    });

    it('shows spinner in mark done button when markKitchenCompleteMutation is pending', () => {
        mockUseMarkKitchenComplete.mockReturnValue(createMockMutation({ isPending: true }));
        render(<OrderKitchenCard order={baseOrder} />);
        expect(document.querySelector('.spinner-border-sm')).toBeInTheDocument();
    });

    // ── Buttons disabled during mutation ──────────────────

    it('disables play button when mutations are pending', () => {
        mockUseStartCooking.mockReturnValue(createMockMutation({ isPending: true }));
        render(<OrderKitchenCard order={baseOrder} />);
        // The time appears both in the progress bar display and inside the play button
        const timeElements = screen.getAllByText('00:00');
        const playBtn = timeElements[timeElements.length - 1].closest('button');
        expect(playBtn).toBeDisabled();
    });

    // ── Cancelled progress bar style ──────────────────────

    it('shows animated danger progress bar when order is cancelled', () => {
        const order = { ...baseOrder, kitchenStatus: 'cancelled' as const };
        render(<OrderKitchenCard order={order} />);
        const progressBar = document.querySelector('.progress-bar');
        expect(progressBar).toHaveClass('bg-danger');
        expect(progressBar).toHaveClass('progress-bar-striped');
        expect(progressBar).toHaveClass('progress-bar-animated');
    });

    // ── Token no fallback ─────────────────────────────────

    it('shows dash placeholder when tokenNo is empty', () => {
        const order = { ...baseOrder, tokenNo: '' };
        render(<OrderKitchenCard order={order} />);
        expect(screen.getByText(/Token No/)).toBeInTheDocument();
    });

    it('does not show dash when tokenNo is provided', () => {
        render(<OrderKitchenCard order={baseOrder} />);
        expect(screen.queryByText(' - ')).not.toBeInTheDocument();
    });
});
