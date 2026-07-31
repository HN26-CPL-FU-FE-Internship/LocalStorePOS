/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import OrderConfirmModal from './index';
import type { CartItem } from '@/types';

// ── Mock react-router-dom ─────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

// ── Mock the POS store ────────────────────────────────────────────
let mockStore: any = {};

vi.mock('@/stores/pos.store', () => ({
    default: (selector?: any) => {
        if (typeof selector === 'function') {
            return selector(mockStore);
        }
        return mockStore;
    },
}));

// ── Mock hooks ────────────────────────────────────────────────────
const mockPlaceOrderMutate = vi.fn();
const mockUpdateOrderMutate = vi.fn();

vi.mock('@/hooks/pos', () => ({
    usePlaceOrder: () => ({
        isPending: false,
        mutate: mockPlaceOrderMutate,
        mutateAsync: vi.fn(),
    }),
    useUpdateOrder: () => ({
        isPending: false,
        mutate: mockUpdateOrderMutate,
        mutateAsync: vi.fn(),
    }),
}));

// ── Mock Toast context ────────────────────────────────────────────
const mockShowToast = vi.fn();
vi.mock('@/hooks/useContextData', () => ({
    default: () => ({ showToast: mockShowToast }),
}));
vi.mock('@/provider/ToastProvider/ToastContext', () => ({
    ToastContext: { Provider: ({ children }: any) => children },
}));

// ── Mock utility functions ────────────────────────────────────────
vi.mock('@/utils', () => ({
    calculateLineTotalPrice: vi.fn((price: number, qty: number) => price * qty),
    toTitleCase: vi.fn((s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')),
}));

// ── Mock Icon component ───────────────────────────────────────────
vi.mock('@/components/common/Icon', () => ({
    default: ({ name }: { name: string }) => React.createElement('span', { 'data-testid': `icon-${name}` }, name),
}));

// ── Sample cart data ──────────────────────────────────────────────
const sampleCartItems: CartItem[] = [
    {
        id: '101-base-no-addons',
        item: {
            id: 101,
            name: 'Burger',
            description: null,
            imagePath: null,
            price: 10,
            netPrice: null,
            foodType: 'veg',
            categoryId: 1,
            categoryName: 'Food',
            taxId: null,
            taxTitle: null,
            taxRate: null,
            variations: [],
            addons: [],
            badge: null,
        },
        variationId: null,
        variationName: null,
        addonIds: [],
        quantity: 2,
        unitPrice: 10,
    },
];

const defaultStore = {
    cartItems: sampleCartItems,
    customer: { value: '1', label: 'John Doe' },
    table: { value: '1', label: 'T1' },
    waiter: null,
    setCustomer: vi.fn(),
    setTable: vi.fn(),
    setPlacingOrder: vi.fn(),
    orderActiveType: 'dine_in',
    resetCart: vi.fn(),
    editingOrderNumber: 'ORD-001',
};

const defaultProps = {
    show: true,
    onHide: vi.fn(),
    subtotal: 20,
    total: 22,
    taxAmount: 2,
    serviceChargeAmount: 1,
    deliveryChargeAmount: 0,
};

describe('Edit Order Flow — OrderConfirmModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStore = { ...defaultStore };
    });

    // ── Edit mode UI ──────────────────────────────────────

    it('shows "Update Order" title when editing', () => {
        render(<OrderConfirmModal {...defaultProps} />);
        expect(screen.getByText('Update Order')).toBeInTheDocument();
        expect(screen.queryByText('Confirm Order')).not.toBeInTheDocument();
    });

    it('shows confirm button text when editing', () => {
        render(<OrderConfirmModal {...defaultProps} />);
        expect(screen.getByText(/Confirm & Update Order/)).toBeInTheDocument();
        expect(screen.queryByText(/Confirm & Place Order/)).not.toBeInTheDocument();
    });

    it('shows edit description when editing', () => {
        render(<OrderConfirmModal {...defaultProps} />);
        expect(screen.getByText(/Review your changes before updating/)).toBeInTheDocument();
    });

    // ── Non-edit mode UI ──────────────────────────────────

    it('shows "Confirm Order" title when creating new order', () => {
        mockStore = { ...defaultStore, editingOrderNumber: null };
        render(<OrderConfirmModal {...defaultProps} />);
        expect(screen.getByText('Confirm Order')).toBeInTheDocument();
        expect(screen.queryByText('Update Order')).not.toBeInTheDocument();
    });

    it('shows create button text when creating new order', () => {
        mockStore = { ...defaultStore, editingOrderNumber: null };
        render(<OrderConfirmModal {...defaultProps} />);
        expect(screen.getByText(/Confirm & Place Order/)).toBeInTheDocument();
    });

    // ── Calls updateOrder mutation when editing ───────────

    it('calls updateOrder mutation when confirming update', () => {
        render(<OrderConfirmModal {...defaultProps} />);
        fireEvent.click(screen.getByText(/Confirm & Update Order/));

        expect(mockUpdateOrderMutate).toHaveBeenCalledOnce();
        expect(mockPlaceOrderMutate).not.toHaveBeenCalled();
    });

    it('passes correct orderNumber and payload to updateOrder', () => {
        render(<OrderConfirmModal {...defaultProps} />);
        fireEvent.click(screen.getByText(/Confirm & Update Order/));

        const callArgs = mockUpdateOrderMutate.mock.calls[0];
        expect(callArgs[0].orderNumber).toBe('ORD-001');
        expect(callArgs[0].data).toBeDefined();
        expect(callArgs[0].data.orderType).toBe('dine_in');
        expect(callArgs[0].data.items).toHaveLength(1);
        expect(callArgs[0].data.items[0].itemId).toBe(101);
    });

    // ── Calls placeOrder mutation when NOT editing ────────

    it('calls placeOrder mutation when creating new order', () => {
        mockStore = { ...defaultStore, editingOrderNumber: null };
        render(<OrderConfirmModal {...defaultProps} />);
        fireEvent.click(screen.getByText(/Confirm & Place Order/));

        expect(mockPlaceOrderMutate).toHaveBeenCalledOnce();
        expect(mockUpdateOrderMutate).not.toHaveBeenCalled();
    });

    // ── Handles onSuccess correctly ───────────────────────

    it('navigates to /orders and shows toast on successful update', async () => {
        mockUpdateOrderMutate.mockImplementation((_payload, { onSuccess }: any) => {
            onSuccess();
        });

        render(<OrderConfirmModal {...defaultProps} />);
        fireEvent.click(screen.getByText(/Confirm & Update Order/));

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith('success', 'Order updated successfully!');
        });
        expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });

    it('resets cart, customer, table, and calls onHide on successful update', async () => {
        const resetCart = vi.fn();
        const setCustomer = vi.fn();
        const setTable = vi.fn();
        const setPlacingOrder = vi.fn();
        const onHide = vi.fn();

        mockStore = {
            ...defaultStore,
            resetCart,
            setCustomer,
            setTable,
            setPlacingOrder,
        };

        mockUpdateOrderMutate.mockImplementation((_payload, { onSuccess }: any) => {
            onSuccess();
        });

        render(<OrderConfirmModal {...defaultProps} onHide={onHide} />);
        fireEvent.click(screen.getByText(/Confirm & Update Order/));

        await waitFor(() => {
            expect(resetCart).toHaveBeenCalledOnce();
            expect(setCustomer).toHaveBeenCalledWith(null);
            expect(setTable).toHaveBeenCalledWith(null);
            expect(onHide).toHaveBeenCalledOnce();
        });
    });

    // ── Handles onError correctly ─────────────────────────

    it('shows error toast on mutation failure', async () => {
        mockUpdateOrderMutate.mockImplementation((_payload, { onError }: any) => {
            onError(new Error('API error'));
        });

        render(<OrderConfirmModal {...defaultProps} />);
        fireEvent.click(screen.getByText(/Confirm & Update Order/));

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith('error', 'Failed to update order. Please try again.');
        });
    });

    // ── Render cart items and payment summary ─────────────

    it('renders all cart items in the table', () => {
        render(<OrderConfirmModal {...defaultProps} />);
        expect(screen.getByText('Burger')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // quantity
    });

    it('renders payment summary amounts', () => {
        render(<OrderConfirmModal {...defaultProps} />);
        // Subtotal $20 appears once; line total for Burger also $20 but in a table
        const twentyDollarElements = screen.getAllByText('$20');
        expect(twentyDollarElements.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('$22')).toBeInTheDocument(); // total
        expect(screen.getByText('$2')).toBeInTheDocument(); // tax
    });
});
