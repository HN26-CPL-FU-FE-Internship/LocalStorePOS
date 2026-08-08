import { beforeEach, describe, expect, it } from 'vitest';
import usePOSCreateOrder from './pos.store';
import type { OrderSummary, POSItem } from '@/types';
import type { OrderItem } from '@/types/order';

const burgerItem: POSItem = {
    id: 101,
    name: 'Burger',
    description: null,
    imagePath: null,
    price: 10,
    netPrice: null,
    foodType: 'veg',
    categoryId: 1,
    categoryName: 'Food',
    taxId: null,
    taxTitle: null,
    taxRate: 10,
    variations: [],
    addons: [],
    badge: null,
};

const makeOrderItem = (overrides: Partial<OrderItem>): OrderItem => ({
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
    taxRate: 10,
    ...overrides,
});

const makeOrder = (items: OrderItem[]): OrderSummary => ({
    id: 1,
    orderNumber: 'ORD-1',
    tokenNo: '20260808-0001',
    orderType: 'dine_in',
    tableNumber: 'T1',
    orderedAt: new Date().toISOString(),
    waiter: 'Waiter',
    waiterId: 1,
    customerId: 1,
    tableId: 1,
    coupon: null as unknown as OrderSummary['coupon'],
    status: 'pending',
    paymentStatus: 'unpaid',
    subtotal: 20,
    taxAmount: 2,
    serviceCharge: 0,
    deliveryCharge: 0,
    tipAmount: 0,
    discountAmount: 0,
    estimatedMinutes: 0,
    cookingStartedAt: '',
    customerName: 'John',
    kitchenStatus: 'in_kitchen',
    grandTotal: 22,
    paidAmount: 0,
    balanceAmount: 0,
    note: null,
    items,
});

const addBurger = (quantity: number) =>
    usePOSCreateOrder.getState().addToCart({
        item: { ...burgerItem, addons: [] },
        variationId: null,
        variationName: null,
        addonIds: [],
        quantity,
        unitPrice: 10,
    });

describe('pos.store — cooked item separation', () => {
    beforeEach(() => {
        usePOSCreateOrder.getState().resetCart();
    });

    it('loadFromOrder keeps cooked lines separate and merges pending lines', () => {
        const order = makeOrder([
            makeOrderItem({ id: 11, quantity: 2, status: 'ready' }),
            makeOrderItem({ id: 12, quantity: 1, status: 'pending' }),
            makeOrderItem({ id: 13, quantity: 1, status: 'pending' }),
        ]);
        usePOSCreateOrder.getState().loadFromOrder(order, [burgerItem]);

        const items = usePOSCreateOrder.getState().cartItems;
        expect(items).toHaveLength(2);

        const ready = items.find((i) => i.status === 'ready');
        expect(ready?.quantity).toBe(2);
        expect(ready?.id).toBe('101-base-no-addons-11');

        const pending = items.find((i) => i.status === 'pending');
        expect(pending?.quantity).toBe(2); // the two pending lines merged
        expect(pending?.id).toBe('101-base-no-addons');
    });

    it('loadFromOrder keeps preparing lines separate too', () => {
        const order = makeOrder([
            makeOrderItem({ id: 11, quantity: 2, status: 'preparing' }),
            makeOrderItem({ id: 12, quantity: 1, status: 'pending' }),
        ]);
        usePOSCreateOrder.getState().loadFromOrder(order, [burgerItem]);

        const items = usePOSCreateOrder.getState().cartItems;
        expect(items).toHaveLength(2);
        expect(items.find((i) => i.status === 'preparing')?.quantity).toBe(2);
        expect(items.find((i) => i.status === 'pending')?.quantity).toBe(1);
    });

    it('addToCart never merges into a preparing line', () => {
        const order = makeOrder([makeOrderItem({ id: 11, quantity: 2, status: 'preparing' })]);
        usePOSCreateOrder.getState().loadFromOrder(order, [burgerItem]);

        addBurger(1);

        const items = usePOSCreateOrder.getState().cartItems;
        expect(items).toHaveLength(2);
        expect(items.find((i) => i.status === 'preparing')?.quantity).toBe(2); // untouched
    });

    it('merges sized items between loadFromOrder and addToCart via variationId', () => {
        const order = makeOrder([
            makeOrderItem({ id: 11, quantity: 2, sizeName: 'Large', variationId: 5, status: 'pending' }),
        ]);
        usePOSCreateOrder.getState().loadFromOrder(order, [burgerItem]);

        usePOSCreateOrder.getState().addToCart({
            item: { ...burgerItem, addons: [] },
            variationId: 5,
            variationName: 'Large',
            addonIds: [],
            quantity: 1,
            unitPrice: 10,
        });

        const items = usePOSCreateOrder.getState().cartItems;
        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(3); // 2 loaded + 1 added merged into one line
    });

    it('loadFromOrder skips cancelled items', () => {
        const order = makeOrder([
            makeOrderItem({ id: 11, quantity: 2, status: 'cancelled' }),
            makeOrderItem({ id: 12, quantity: 1, status: 'pending' }),
        ]);
        usePOSCreateOrder.getState().loadFromOrder(order, [burgerItem]);

        const items = usePOSCreateOrder.getState().cartItems;
        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(1);
        expect(items[0].status).toBe('pending');
    });

    it('addToCart never merges into a cooked (ready) line', () => {
        const order = makeOrder([makeOrderItem({ id: 11, quantity: 2, status: 'ready' })]);
        usePOSCreateOrder.getState().loadFromOrder(order, [burgerItem]);

        addBurger(1);

        const items = usePOSCreateOrder.getState().cartItems;
        expect(items).toHaveLength(2);

        const ready = items.find((i) => i.status === 'ready');
        expect(ready?.quantity).toBe(2); // untouched

        const added = items.find((i) => i.status !== 'ready');
        expect(added?.quantity).toBe(1);
        expect(added?.status).toBeUndefined(); // a brand-new line
    });

    it('addToCart merges into a pending line instead of creating a third line', () => {
        const order = makeOrder([
            makeOrderItem({ id: 11, quantity: 2, status: 'ready' }),
            makeOrderItem({ id: 12, quantity: 1, status: 'pending' }),
        ]);
        usePOSCreateOrder.getState().loadFromOrder(order, [burgerItem]);

        addBurger(1);

        const items = usePOSCreateOrder.getState().cartItems;
        expect(items).toHaveLength(2); // ready + pending — no third line

        const ready = items.find((i) => i.status === 'ready');
        expect(ready?.quantity).toBe(2);

        const pending = items.find((i) => i.status === 'pending');
        expect(pending?.quantity).toBe(2); // 1 + 1 merged
    });

    it('addToCart merges repeated adds on a fresh cart', () => {
        addBurger(1);
        addBurger(2);

        const items = usePOSCreateOrder.getState().cartItems;
        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(3);
    });
});
