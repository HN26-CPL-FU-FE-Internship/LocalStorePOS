import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TabContent from './index';
import type { OrderItemType, OrderSummary } from '@/types';

// Mock dependencies

const { mockAuth } = vi.hoisted(() => ({
    mockAuth: { isAdmin: true },
}));

vi.mock('@/hooks/useAuth', () => ({
    default: () => ({
        hasPermission: () => true,
        user: { role: mockAuth.isAdmin ? 'Admin / Owner' : 'Waiter' },
        isAdmin: mockAuth.isAdmin,
    }),
}));

vi.mock('@/hooks/useContextData', () => ({
    default: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/hooks/order/', () => ({
    useUpdateStatus: () => ({ mutate: vi.fn() }),
    usePayOrder: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/lib', () => ({
    queryClient: { invalidateQueries: vi.fn() },
}));

vi.mock('@/components/common/Icon', () => ({
    default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

// Track which confirmation flow is triggered (admins bypass approval)
vi.mock('@/components/common/ConfirmModal', () => ({
    default: ({ show }: { show: boolean }) => (show ? <div data-testid="confirm-modal" /> : null),
}));

vi.mock('@/components/common/ApprovalRequestModal', () => ({
    default: ({ show }: { show: boolean }) => (show ? <div data-testid="approval-modal" /> : null),
}));

vi.mock('../OrderModal', () => ({
    default: () => null,
}));

vi.mock('../PayOrderModal', () => ({
    default: () => null,
}));

vi.mock('../OrderItemRow', () => ({
    default: ({
        item,
        isExtra,
        inSplit,
    }: {
        item: OrderItemType;
        isExtra?: boolean;
        inSplit?: boolean;
    }) => (
        <div
            data-testid="order-item-row"
            data-extra={isExtra ? 'true' : 'false'}
            data-insplit={inSplit ? 'true' : 'false'}
        >
            {item.itemName}
        </div>
    ),
}));

// Render a marker only when the print bill modal is shown, carrying the order number
vi.mock('../PrintBillModal', () => ({
    default: ({ show, order }: { show: boolean; order: OrderSummary | null }) =>
        show ? <div data-testid="print-bill-modal">{order?.orderNumber}</div> : null,
}));

// Sample order

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
    subtotal: 100,
    taxAmount: 10,
    serviceCharge: 5,
    deliveryCharge: 0,
    tipAmount: 0,
    discountAmount: 0,
    estimatedMinutes: 15,
    cookingStartedAt: '',
    customerName: 'John Doe',
    kitchenStatus: 'new_order',
    grandTotal: 115,
    paidAmount: 0,
    balanceAmount: 115,
    note: null,
    items: [{ id: 1, itemId: 101, itemName: 'Burger', quantity: 2, kitchenNote: null, sizeName: null, unitPrice: 10, addons: [], variationId: null, status: 'pending', taxRate: 0 }],
};

const renderTabContent = () =>
    render(
        <MemoryRouter initialEntries={['/orders']}>
            <TabContent order={baseOrder} />
        </MemoryRouter>,
    );

describe('TabContent - split tags wiring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('tags the fresh line as extra and its started sibling as in-split', () => {
        const order: OrderSummary = {
            ...baseOrder,
            items: [
                { ...baseOrder.items[0], id: 11, quantity: 2, status: 'ready' },
                { ...baseOrder.items[0], id: 12, quantity: 1, status: 'pending' },
            ],
        };
        render(
            <MemoryRouter initialEntries={['/orders']}>
                <TabContent order={order} />
            </MemoryRouter>,
        );

        const rows = screen.getAllByTestId('order-item-row');
        expect(rows).toHaveLength(2);
        // ready sibling → in-split; pending fresh line → extra
        expect(rows[0]).toHaveAttribute('data-insplit', 'true');
        expect(rows[1]).toHaveAttribute('data-extra', 'true');
    });

    it('does not tag rows when there is no split', () => {
        render(
            <MemoryRouter initialEntries={['/orders']}>
                <TabContent order={baseOrder} />
            </MemoryRouter>,
        );

        const rows = screen.getAllByTestId('order-item-row');
        expect(rows[0]).toHaveAttribute('data-extra', 'false');
        expect(rows[0]).toHaveAttribute('data-insplit', 'false');
    });
});

describe('TabContent - cancel invoice approval flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.isAdmin = true;
    });

    it('admins cancel directly via the confirmation modal (no approval request)', async () => {
        mockAuth.isAdmin = true;
        const { container } = renderTabContent();

        const actionToggle = container.querySelector('.dropstart .dropdown-toggle') as HTMLElement;
        fireEvent.click(actionToggle);
        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => expect(screen.getByTestId('confirm-modal')).toBeInTheDocument());
        expect(screen.queryByTestId('approval-modal')).not.toBeInTheDocument();
    });

    it('non-admin cancels via the approval request modal (not a direct confirmation)', async () => {
        mockAuth.isAdmin = false;
        const { container } = renderTabContent();

        const actionToggle = container.querySelector('.dropstart .dropdown-toggle') as HTMLElement;
        fireEvent.click(actionToggle);
        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => expect(screen.getByTestId('approval-modal')).toBeInTheDocument());
        expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
    });
});

describe('TabContent - Print Bill wiring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.isAdmin = true;
    });

    it('opens the PrintBillModal for the order when Print Receipt is clicked', async () => {
        const { container } = renderTabContent();

        // The print bill modal starts closed
        expect(screen.queryByTestId('print-bill-modal')).not.toBeInTheDocument();

        // Open the order action dropdown (scoped to the action menu via its dropstart class)
        const actionToggle = container.querySelector('.dropstart .dropdown-toggle') as HTMLElement;
        expect(actionToggle).toBeTruthy();
        fireEvent.click(actionToggle);

        // Click the "Print Receipt" menu item
        const printItem = screen.getByText('Print Receipt');
        fireEvent.click(printItem);

        // The print bill modal for this order is now visible
        await waitFor(() => expect(screen.getByTestId('print-bill-modal')).toBeInTheDocument());
        expect(screen.getByTestId('print-bill-modal')).toHaveTextContent('ORD-001');
    });

    it('does not open the PrintBillModal when a different action is chosen', async () => {
        const { container } = renderTabContent();

        const actionToggle = container.querySelector('.dropstart .dropdown-toggle') as HTMLElement;
        fireEvent.click(actionToggle);

        // Choose "Cancel" instead of "Print Receipt"
        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => expect(screen.queryByTestId('print-bill-modal')).not.toBeInTheDocument());
    });
});
