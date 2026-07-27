import type { CartItem, OrderSummary, POSItem } from '@/types';
import type { SingleValue } from 'react-select';
import { create } from 'zustand';

type CreateOrderStore = {
    orderActiveType: string;
    activeCategory: number;
    cartItems: CartItem[];
    searchText: string;
    expandCartIds: Set<string>;
    customer: CartSelected | null;
    table: CartSelected | null;
    placingOrder: boolean;
    waiter: CartSelected | null;
    /** Order number being edited (null = new order) */
    editingOrderNumber: string | null;
    setEditingOrderNumber: (value: string | null) => void;
    setWaiter: (value: SingleValue<CartSelected>) => void;
    setPlacingOrder: (value: boolean) => void;
    setTable: (value: SingleValue<CartSelected>) => void;
    setCustomer: (value: SingleValue<CartSelected>) => void;
    setSearchText: (value: string) => void;
    setOrderActiveType: (value: string) => void;
    setActiveCategory: (value: number) => void;
    addToCart: (value: CartPayLoad) => void;
    removeCartItem: (id: string) => void;
    toggleExpandCartItem: (id: string) => void;
    updateCartNote: (id: string, note: string) => void;
    updateCartQuantity: (id: string, delta: number) => void;
    resetCart: () => void;
    /** Populate the store from an existing order for editing */
    loadFromOrder: (order: OrderSummary, menuItems: POSItem[]) => void;
};

export type CartPayLoad = {
    item: POSItem;
    variationId: number | null;
    variationName: string | null;
    addonIds: number[];
    quantity: number;
    unitPrice: number;
};

type CartSelected = {
    value: string;
    label: string;
};

const usePOSCreateOrder = create<CreateOrderStore>((set) => ({
    orderActiveType: 'dine_in',
    activeCategory: 0,
    cartItems: [],
    searchText: '',
    expandCartIds: new Set(''),
    customer: null,
    table: null,
    placingOrder: false,
    waiter: null,
    editingOrderNumber: null,

    setEditingOrderNumber: (value) =>
        set(() => ({
            editingOrderNumber: value,
        })),

    setSearchText: (value) =>
        set(() => ({
            searchText: value,
        })),
    setOrderActiveType: (value) =>
        set(() => ({
            orderActiveType: value,
        })),
    setActiveCategory: (value) => set(() => ({ activeCategory: value })),
    resetCart: () =>
        set(() => ({
            cartItems: [],
            editingOrderNumber: null,
            orderActiveType: 'dine_in',
            customer: null,
            table: null,
            waiter: null,
        })),
    addToCart: (payload) => {
        const cartId = `${payload.item.id}-${payload.variationId ?? 'base'}-${payload.item.addons.map((a) => `${a.id}x${a.quantity}`).join('-') ?? 'no-addons'}`;

        set((state) => {
            const { cartItems } = state;
            const existing = cartItems.find((item) => item.id === cartId);
            if (existing) {
                return {
                    cartItems: cartItems.map((c) =>
                        c.id === cartId
                            ? {
                                  ...c,
                                  quantity: c.quantity + payload.quantity,
                              }
                            : c,
                    ),
                };
            }

            return {
                cartItems: [
                    ...cartItems,
                    {
                        id: cartId,
                        item: payload.item,
                        variationId: payload.variationId,
                        variationName: payload.variationName,
                        addonIds: payload.addonIds,
                        quantity: payload.quantity,
                        unitPrice: payload.unitPrice,
                    },
                ],
            };
        });
    },
    removeCartItem: (id) => {
        set((state) => {
            return {
                cartItems: state.cartItems.filter((item) => item.id !== id),
            };
        });
    },
    toggleExpandCartItem: (id: string) => {
        set((state) => {
            const next = new Set(state.expandCartIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return {
                expandCartIds: next,
            };
        });
    },
    setCustomer: (value) => {
        set(() => ({
            customer: value,
        }));
    },
    setTable: (value) =>
        set(() => ({
            table: value,
        })),

    updateCartNote: (id, note) => {
        set((state) => ({
            cartItems: state.cartItems.map((c) => (c.id === id ? { ...c, note: note } : c)),
        }));
    },

    updateCartQuantity: (id, delta) => {
        set((state) => ({
            cartItems: state.cartItems.map((c) =>
                c.id === id
                    ? {
                          ...c,
                          quantity: Math.max(1, c.quantity + delta),
                      }
                    : c,
            ),
        }));
    },
    setPlacingOrder: (value) =>
        set(() => ({
            placingOrder: value,
        })),

    setWaiter: (value) =>
        set(() => ({
            waiter: value,
        })),

    loadFromOrder: (order, menuItems) => {
        // Build minimal POSItem for each order item
        const cartItems: CartItem[] = order.items.map((item) => {
            const addonKey = item.addons.map((a) => `${a.addonId}x${a.quantity}`).join('-');
            const cartId = `${item.itemId}-${item.sizeName ?? 'base'}-${addonKey || 'no-addons'}`;
            const taxRate = menuItems.find((menuItem) => menuItem.id === item.itemId)?.taxRate ?? 0;
            return {
                id: cartId,
                item: {
                    id: item.itemId,
                    name: item.itemName,
                    description: null,
                    imagePath: null,
                    price: item.unitPrice,
                    netPrice: null,
                    foodType: 'veg',
                    categoryId: 0,
                    categoryName: '',
                    taxId: null,
                    taxTitle: null,
                    taxRate: taxRate,
                    variations: item.sizeName
                        ? [
                              {
                                  id: item.variationId ?? item.itemId,
                                  sizeName: item.sizeName,
                                  price: item.unitPrice,
                              },
                          ]
                        : [],
                    addons: item.addons.map((a) => ({
                        id: a.addonId,
                        name: a.addonName,
                        price: a.addonPrice,
                        description: null,
                        quantity: a.quantity,
                    })),
                    badge: null,
                },
                variationId: item.variationId ?? null,
                variationName: item.sizeName ?? null,
                addonIds: item.addons.map((a) => a.addonId),
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                note: item.kitchenNote ?? undefined,
            };
        });

        set(() => ({
            cartItems,
            orderActiveType: order.orderType,
            customer:
                order.customerName && order.customerId
                    ? { value: String(order.customerId), label: order.customerName }
                    : null,
            table:
                order.tableNumber && order.tableId ? { value: String(order.tableId), label: order.tableNumber } : null,
            waiter: order.waiter && order.waiterId ? { value: String(order.waiterId), label: order.waiter } : null,
            editingOrderNumber: order.orderNumber,
        }));
    },
}));

export default usePOSCreateOrder;
