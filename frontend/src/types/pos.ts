import type { CategoryEntry } from '@/api/category.api';

/* ------------------------------------------------------------------ */
/*  POS - Recent Order                                                */
/* ------------------------------------------------------------------ */
export interface RecentOrder {
    id: number;
    orderNumber: string;
    tokenNo: string;
    orderType: string;
    tableNumber: string | null;
    status: string;
    kitchenStatus: string;
    customerName: string;
    estimatedMinutes: number | null;
    cookingStartedAt: string | null;
    orderedAt: string;
}

export interface PageContent<T> {
    content: T[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    first: boolean;
    last: boolean;
}

/* ------------------------------------------------------------------ */
/*  POS - Category (virtual All + API)                                */
/* ------------------------------------------------------------------ */
export type POSCategory = CategoryEntry & { isAll?: boolean };

/* ------------------------------------------------------------------ */
/*  POS - Menu Item                                                   */
/* ------------------------------------------------------------------ */
export interface ItemVariation {
    id: number;
    sizeName: string;
    price: number;
}

export interface ItemAddon {
    id: number;
    name: string;
    price: number;
    description: string | null;
    quantity: number;
}

export interface POSItem {
    id: number;
    name: string;
    description: string | null;
    imagePath: string | null;
    price: number;
    netPrice: number | null;
    foodType: string;
    categoryId: number;
    categoryName: string;
    taxId: number | null;
    taxTitle: string | null;
    taxRate: number | null;
    variations: ItemVariation[];
    addons: ItemAddon[];
    /** "trending" | "must_try" | null */
    badge: string | null;
}

/* ------------------------------------------------------------------ */
/*  POS - Cart Item                                                   */
/* ------------------------------------------------------------------ */

/**
 * Kitchen status of an order item loaded into the cart while editing an
 * order. Lines the kitchen already started or finished ({@code preparing}/
 * {@code ready}/{@code served}) are kept separate from newly-added ones so
 * the kitchen cooks only the new quantity.
 */
export type CartItemStatus = 'pending' | 'preparing' | 'ready' | 'served';

export interface CartItem {
    id: string; // unique key for cart line (itemId-variationId combo)
    item: POSItem;
    variationId: number | null;
    variationName: string | null;
    addonIds: number[];
    quantity: number;
    unitPrice: number;
    note?: string;
    /** Status of the underlying order item when editing (undefined = new line). */
    status?: CartItemStatus;
}

export type PlaceOrder = {
    orderType: string;
    customerId?: number | null;
    waiterId?: number | null;
    tableId?: number | null;
    subtotal: number;
    taxAmount: number;
    serviceCharge: number;
    deliveryCharge: number;
    grandTotal: number;
    note?: string | null;
    items: Array<{
        itemId: number;
        variationId?: number | null;
        itemName: string;
        unitPrice: number;
        quantity: number;
        lineTotal: number; // tiền 1 dòng chưa tính thuế
        kitchenNote?: string | null;
        addons?: Array<{
            addonId: number;
            addonName: string;
            addonPrice: number;
            quantity: number;
        }>;
    }>;
};
