import type { CartItem, CartItemStatus, OrderSummary, POSItem } from '@/types';
import type { SingleValue } from 'react-select';
import { create } from 'zustand';
import { buildMenuItemKey, isItemStarted } from '@/utils';

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
        const cartId = buildMenuItemKey(
            payload.item.id,
            payload.variationId != null ? String(payload.variationId) : null,
            payload.item.addons.map((a) => ({ addonId: a.id, quantity: a.quantity })),
        );

        set((state) => {
            const { cartItems } = state;
            // Never merge a new addition into a line the kitchen has already
            // started (preparing) or finished (ready/served) — the new quantity
            // stays a separate pending line.
            const existing = cartItems.find((item) => item.id === cartId && !isItemStarted(item.status));
            if (existing) {
                return {
                    cartItems: cartItems.map((c) =>
                        c.id === cartId && !isItemStarted(c.status)
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
        const cartItems: CartItem[] = [];
        // Fresh (pending) lines are merged into a single cart line per key;
        // lines the kitchen already started or finished (preparing/ready/served)
        // are kept separate so new additions can never merge into them.
        // Cancelled history lines are skipped entirely.
        const pendingByKey = new Map<string, CartItem>();

        order.items.forEach((item) => {
            if (item.status === 'cancelled') return;

            // Canonical key uses the variation id (same as addToCart and the
            // backend's buildExistingItemKey) so sized lines load and re-add
            // with the same id and merge correctly.
            const baseId = buildMenuItemKey(
                item.itemId,
                item.variationId != null ? String(item.variationId) : null,
                item.addons,
            );
            const matchItem = menuItems.find((menuItem) => menuItem.id === item.itemId);

            const buildLine = (id: string, status?: CartItemStatus): CartItem => ({
                id,
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
                    taxRate: matchItem?.taxRate ?? 0,
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
                status,
            });

            if (isItemStarted(item.status)) {
                // Unique id so the started line can never be merged with a new addition
                cartItems.push(buildLine(`${baseId}-${item.id}`, item.status as CartItemStatus));
            } else {
                const existing = pendingByKey.get(baseId);
                if (existing) {
                    existing.quantity += item.quantity;
                } else {
                    const line = buildLine(baseId, 'pending');
                    pendingByKey.set(baseId, line);
                    cartItems.push(line);
                }
            }
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
