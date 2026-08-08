import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderItemRow from './index';
import type { OrderItemType } from '@/types';

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

describe('OrderItemRow', () => {
    it('renders item name and quantity', () => {
        render(<OrderItemRow item={baseItem} />);
        expect(screen.getByText('Burger')).toBeInTheDocument();
        expect(screen.getByText('x2')).toBeInTheDocument();
    });

    it('renders size name when provided', () => {
        render(<OrderItemRow item={{ ...baseItem, sizeName: 'Large' }} />);
        expect(screen.getByText(/Large/)).toBeInTheDocument();
    });

    it('renders kitchen note when provided', () => {
        render(<OrderItemRow item={{ ...baseItem, kitchenNote: 'No onions' }} />);
        expect(screen.getByText(/No onions/)).toBeInTheDocument();
    });

    it('does not render a note section when kitchenNote is null', () => {
        render(<OrderItemRow item={baseItem} />);
        expect(screen.queryByText(/Notes?/)).not.toBeInTheDocument();
    });

    // ── Split labels (started sibling + extra) ──────────────────────

    it('renders a Ready badge for a started line in a split', () => {
        render(<OrderItemRow item={{ ...baseItem, status: 'ready' }} inSplit />);
        expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('renders a Cooking badge for a preparing line in a split', () => {
        render(<OrderItemRow item={{ ...baseItem, status: 'preparing' }} inSplit />);
        expect(screen.getByText('Cooking')).toBeInTheDocument();
    });

    it('renders an Extra badge for the freshly-added line', () => {
        render(<OrderItemRow item={baseItem} isExtra />);
        expect(screen.getByText('Extra')).toBeInTheDocument();
    });

    it('renders both status and Extra badges together', () => {
        render(<OrderItemRow item={{ ...baseItem, status: 'ready' }} isExtra inSplit />);
        expect(screen.getByText('Ready')).toBeInTheDocument();
        expect(screen.getByText('Extra')).toBeInTheDocument();
    });

    it('renders no split badges by default', () => {
        render(<OrderItemRow item={baseItem} />);
        expect(screen.queryByText('Extra')).not.toBeInTheDocument();
        expect(screen.queryByText('Cooking')).not.toBeInTheDocument();
        expect(screen.queryByText('Ready')).not.toBeInTheDocument();
        expect(screen.queryByText('Served')).not.toBeInTheDocument();
    });

    it('does not render a status badge for a started line outside a split', () => {
        render(<OrderItemRow item={{ ...baseItem, status: 'ready' }} />);
        expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    });
});
