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
export interface CartItem {
    id: string; // unique key for cart line (itemId-variationId combo)
    item: POSItem;
    variationId: number | null;
    variationName: string | null;
    addonIds: number[];
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    note?: string;
}
