import { describe, expect, it } from 'vitest';
import { buildMenuItemKey, computeKitchenSplitItems } from './pos';
import type { OrderItemType } from '@/types';

describe('buildMenuItemKey', () => {
    it('builds a key with base variation and no addons', () => {
        expect(buildMenuItemKey(101, null, [])).toBe('101-base-no-addons');
    });

    it('builds a key with a variation', () => {
        expect(buildMenuItemKey(101, 'Large', [])).toBe('101-Large-no-addons');
    });

    it('includes addon ids and quantities', () => {
        expect(buildMenuItemKey(101, null, [{ addonId: 5, quantity: 2 }])).toBe('101-base-5x2');
    });

    it('sorts addon parts so the key is order-independent', () => {
        const a = buildMenuItemKey(101, null, [
            { addonId: 5, quantity: 2 },
            { addonId: 7, quantity: 1 },
        ]);
        const b = buildMenuItemKey(101, null, [
            { addonId: 7, quantity: 1 },
            { addonId: 5, quantity: 2 },
        ]);
        expect(a).toBe(b);
    });
});

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

describe('computeKitchenSplitItems', () => {
    it('tags a fresh line as extra when a cooked sibling exists', () => {
        const ready = makeItem({ id: 11, quantity: 2, status: 'ready' });
        const extra = makeItem({ id: 12, quantity: 1, status: 'pending' });

        const { extraIds, splitStartedIds } = computeKitchenSplitItems([ready, extra]);
        expect(extraIds.has(12)).toBe(true);
        expect(splitStartedIds.has(11)).toBe(true);
        expect(extraIds.has(11)).toBe(false);
    });

    it('tags a fresh line as extra when a preparing sibling exists', () => {
        const preparing = makeItem({ id: 11, quantity: 2, status: 'preparing' });
        const extra = makeItem({ id: 12, quantity: 1, status: 'pending' });

        const { extraIds, splitStartedIds } = computeKitchenSplitItems([preparing, extra]);
        expect(extraIds.has(12)).toBe(true);
        expect(splitStartedIds.has(11)).toBe(true);
    });

    it('does not tag anything when all lines are fresh', () => {
        const a = makeItem({ id: 11, status: 'pending' });
        const b = makeItem({ id: 12, status: 'pending' });

        const { extraIds, splitStartedIds } = computeKitchenSplitItems([a, b]);
        expect(extraIds.size).toBe(0);
        expect(splitStartedIds.size).toBe(0);
    });

    it('does not tag a single line', () => {
        const ready = makeItem({ id: 11, status: 'ready' });

        const { extraIds, splitStartedIds } = computeKitchenSplitItems([ready]);
        expect(extraIds.size).toBe(0);
        expect(splitStartedIds.size).toBe(0);
    });

    it('separates different menu lines (different addons)', () => {
        const plain = makeItem({ id: 11, status: 'ready' });
        const withCheese = makeItem({ id: 12, status: 'pending', addons: [{ id: 1, addonId: 5, addonName: 'Cheese', addonPrice: 2, quantity: 1 }] });

        const { extraIds, splitStartedIds } = computeKitchenSplitItems([plain, withCheese]);
        expect(extraIds.size).toBe(0);
        expect(splitStartedIds.size).toBe(0);
    });
});
