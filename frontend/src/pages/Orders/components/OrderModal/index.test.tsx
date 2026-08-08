import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderModal from './index';
import type { OrderItemType, OrderSummary } from '@/types';

vi.mock('@/components/common/Icon', () => ({
    default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

const makeItem = (overrides: Partial<OrderItemType>): OrderItemType => ({
    id: 1,
    itemId: 101,
    itemName: 'Burger',
    quantity: 1,
    kitchenNote: null,
    sizeName: null,
    unitPrice: 10,
    addons: [],
    variationId: null,
    status: 'pending',
    taxRate: 0,
    ...overrides,
});

const baseOrder: OrderSummary = {
    id: 1,
    orderNumber: 'ORD-001',
    tokenNo: 'T001',
    orderType: 'dine_in',
    tableNumber: 'A1',
    orderedAt: '2025-01-01T12:00:00',
    waiter: 'John',
    waiterId: null,
    customerId: null,
    tableId: null,
    coupon: { code: '', discountAmount: 0, discountType: 'fixed_amount' },
    status: 'pending',
    paymentStatus: 'unpaid',
    subtotal: 10,
    taxAmount: 1,
    serviceCharge: 0,
    deliveryCharge: 0,
    tipAmount: 0,
    discountAmount: 0,
    estimatedMinutes: 15,
    cookingStartedAt: '',
    customerName: 'John Doe',
    kitchenStatus: 'new_order',
    grandTotal: 11,
    paidAmount: 0,
    balanceAmount: 11,
    note: null,
    items: [makeItem({ id: 1, quantity: 2 })],
};

describe('OrderModal - started/new split tags', () => {
    it('renders an Extra badge on the freshly-added line and a status badge on its started sibling', () => {
        const order: OrderSummary = {
            ...baseOrder,
            items: [
                makeItem({ id: 11, quantity: 2, status: 'ready' }),
                makeItem({ id: 12, quantity: 1, status: 'pending' }),
            ],
        };
        render(<OrderModal show orderContent={order} onHide={vi.fn()} />);
        expect(screen.getByText('Extra')).toBeInTheDocument();
        expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('shows a Cooking badge for a preparing sibling in a split', () => {
        const order: OrderSummary = {
            ...baseOrder,
            items: [
                makeItem({ id: 11, quantity: 2, status: 'preparing' }),
                makeItem({ id: 12, quantity: 1, status: 'pending' }),
            ],
        };
        render(<OrderModal show orderContent={order} onHide={vi.fn()} />);
        expect(screen.getByText('Extra')).toBeInTheDocument();
        expect(screen.getByText('Cooking')).toBeInTheDocument();
    });

    it('does not render split tags when all lines are fresh', () => {
        const order: OrderSummary = {
            ...baseOrder,
            items: [
                makeItem({ id: 11, quantity: 2, status: 'pending' }),
                makeItem({ id: 12, quantity: 1, status: 'pending' }),
            ],
        };
        render(<OrderModal show orderContent={order} onHide={vi.fn()} />);
        expect(screen.queryByText('Extra')).not.toBeInTheDocument();
        expect(screen.queryByText('Cooking')).not.toBeInTheDocument();
        expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    });

    it('does not render split tags for a single line', () => {
        render(<OrderModal show orderContent={baseOrder} onHide={vi.fn()} />);
        expect(screen.queryByText('Extra')).not.toBeInTheDocument();
        expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    });
});
