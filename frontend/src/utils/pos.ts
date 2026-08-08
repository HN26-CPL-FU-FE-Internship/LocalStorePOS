import { isItemStarted } from './order';
import type { OrderItemType } from '@/types';

export const calculateLineTotalPrice = (unitPrice: number, quantity: number) => unitPrice * quantity;

/**
 * Stable key identifying a menu line: {@code itemId-variationKey-addons}.
 * Mirrors the backend's {@code buildExistingItemKey} (variation id + sorted
 * addon ids/quantities) so the kitchen and the edit-order cart group lines
 * exactly the way the backend decides whether to split them.
 *
 * {@code variationKey} should be the variation id (as a string) to match
 * {@code addToCart} and the backend; size names are never used as keys.
 */
export function buildMenuItemKey(
    itemId: number,
    variationKey: string | null | undefined,
    addons: ReadonlyArray<{ addonId: number; quantity: number }>,
): string {
    const addonKey = addons
        .map((a) => `${a.addonId}x${a.quantity}`)
        .sort()
        .join('-');
    return `${itemId}-${variationKey ?? 'base'}-${addonKey || 'no-addons'}`;
}

/**
 * Detect the "extra" amount split: when the same menu item appears more than
 * once in an order and at least one line has already been started/finished by
 * the kitchen (preparing/ready/served), the fresh lines are the newly-added
 * portion ({@code extraIds}) and the started lines are their cooked siblings
 * ({@code splitStartedIds}).
 */
export function computeKitchenSplitItems(items: OrderItemType[]): {
    extraIds: Set<number>;
    splitStartedIds: Set<number>;
} {
    const groups = new Map<string, OrderItemType[]>();
    for (const item of items) {
        // Variation id is the canonical key — same as the backend's
        // buildExistingItemKey when it decides whether to split a line.
        const key = buildMenuItemKey(
            item.itemId,
            item.variationId != null ? String(item.variationId) : null,
            item.addons,
        );
        const group = groups.get(key);
        if (group) {
            group.push(item);
        } else {
            groups.set(key, [item]);
        }
    }

    const extraIds = new Set<number>();
    const splitStartedIds = new Set<number>();
    for (const group of groups.values()) {
        const hasStarted = group.some((it) => isItemStarted(it.status));
        if (group.length > 1 && hasStarted) {
            group.forEach((it) => {
                if (isItemStarted(it.status)) {
                    splitStartedIds.add(it.id);
                } else {
                    extraIds.add(it.id);
                }
            });
        }
    }
    return { extraIds, splitStartedIds };
}
