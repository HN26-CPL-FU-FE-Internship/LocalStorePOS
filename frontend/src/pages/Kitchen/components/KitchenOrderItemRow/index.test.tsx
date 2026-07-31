import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import KitchenOrderItemRow from './index';
import type { OrderItemType } from '@/types';

vi.mock('@/hooks/useContextData', () => ({
    default: () => ({ showToast: vi.fn() }),
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function renderWithProviders(ui: React.ReactElement) {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const baseItem: OrderItemType = {
    id: 1,
    itemId: 101,
    itemName: 'Burger',
    quantity: 2,
    kitchenNote: null,
    sizeName: null,
    unitPrice: 10,
    addons: [],
    variationId: null,
    status: 'pending',
    taxRate: 0,
};

describe('KitchenOrderItemRow', () => {
    // ── Basic rendering ──────────────────────────────────

    it('renders item name', () => {
        renderWithProviders(<KitchenOrderItemRow item={baseItem} />);
        expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    it('renders quantity with × prefix', () => {
        renderWithProviders(<KitchenOrderItemRow item={baseItem} />);
        expect(screen.getByText('×2')).toBeInTheDocument();
    });

    it('renders size name when provided', () => {
        const item = { ...baseItem, sizeName: 'Large' };
        renderWithProviders(<KitchenOrderItemRow item={item} />);
        expect(screen.getByText(/Large/)).toBeInTheDocument();
    });

    it('does not render size separator when sizeName is null', () => {
        renderWithProviders(<KitchenOrderItemRow item={baseItem} />);
        expect(screen.queryByText('- Large')).not.toBeInTheDocument();
        expect(screen.queryByText(/ - /)).not.toBeInTheDocument();
    });

    // ── Kitchen note ──────────────────────────────────────

    it('renders kitchen note when provided', () => {
        const item = { ...baseItem, kitchenNote: 'No onions' };
        renderWithProviders(<KitchenOrderItemRow item={item} />);
        expect(screen.getByText(/No onions/)).toBeInTheDocument();
    });

    it('does not render note section when kitchenNote is null', () => {
        renderWithProviders(<KitchenOrderItemRow item={baseItem} />);
        expect(screen.queryByText(/Notes?/)).not.toBeInTheDocument();
    });

    it('does not render note section when kitchenNote is empty', () => {
        const item = { ...baseItem, kitchenNote: '' };
        renderWithProviders(<KitchenOrderItemRow item={item} />);
        expect(screen.queryByText(/Notes?/)).not.toBeInTheDocument();
    });

    // ── Addons (formatAddonNote renders "Name xQty / item") ─

    it('renders addon names and quantities', () => {
        const item = {
            ...baseItem,
            addons: [
                { id: 1, addonId: 201, addonName: 'Cheese', addonPrice: 2, quantity: 1 },
                { id: 2, addonId: 202, addonName: 'Bacon', addonPrice: 3, quantity: 2 },
            ],
        };
        renderWithProviders(<KitchenOrderItemRow item={item} />);
        expect(screen.getByText(/Cheese/)).toBeInTheDocument();
        expect(screen.getByText(/Bacon/)).toBeInTheDocument();
        expect(screen.getByText(/x1/)).toBeInTheDocument();
        expect(screen.getByText(/x2/)).toBeInTheDocument();
    });

    it('does not render addons section when addons is empty', () => {
        renderWithProviders(<KitchenOrderItemRow item={baseItem} />);
        expect(screen.queryByText('Addons')).not.toBeInTheDocument();
    });

    it('renders addon with quantity > 1 showing xN format', () => {
        const item = {
            ...baseItem,
            addons: [
                { id: 1, addonId: 201, addonName: 'Extra Cheese', addonPrice: 2, quantity: 3 },
            ],
        };
        renderWithProviders(<KitchenOrderItemRow item={item} />);
        expect(screen.getByText(/Extra Cheese/)).toBeInTheDocument();
        expect(screen.getByText(/x3/)).toBeInTheDocument();
    });

    // ── Combined rendering ────────────────────────────────

    it('renders item with all optional fields', () => {
        const item: OrderItemType = {
            id: 1,
            itemId: 101,
            itemName: 'Pizza',
            quantity: 1,
            kitchenNote: 'Well done',
            sizeName: 'Large',
            unitPrice: 15,
            addons: [
                { id: 1, addonId: 301, addonName: 'Pepperoni', addonPrice: 2, quantity: 1 },
            ],
            variationId: 10,
            status: 'pending',
            taxRate: 0,
        };
        renderWithProviders(<KitchenOrderItemRow item={item} />);
        expect(screen.getByText(/Pizza/)).toBeInTheDocument();
        expect(screen.getByText('×1')).toBeInTheDocument();
        expect(screen.getByText(/Well done/)).toBeInTheDocument();
        expect(screen.getByText(/Large/)).toBeInTheDocument();
        expect(screen.getByText(/Pepperoni/)).toBeInTheDocument();
    });
});
