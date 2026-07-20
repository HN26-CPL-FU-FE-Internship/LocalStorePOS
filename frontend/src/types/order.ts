import type { ORDER_STATUS } from '@/constants';
import type { KitchenStatus, Time } from '@/types';

export type OrderQuery = Time & {
    status: OrderStatus | string;
    page: number;
    size: number;
    orderNumber: string;
};

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export type OrderStat = {
    cancelled: number;
    completed: number;
    delivered: number;
    pending: number;
    preparing: number;
    served: number;
    total: number;
};

interface OrderItemAddon {
    id: number;
    addonName: string;
    addonPrice: number;
    quantity: number;
}

export interface OrderItem {
    id: number;
    itemName: string;
    quantity: number;
    kitchenNote: string | null;
    sizeName: string | null;
    unitPrice: number;
    addons: OrderItemAddon[];
}

export type DiscountType = 'percentage' | 'fixed_amount';
export interface CouponOrder {
    code: string;
    discountAmount: number;
    discountType: DiscountType;
}

export type OrderSummary = {
    id: number;
    orderNumber: string;
    tokenNo: string;
    orderType: string;
    tableNumber: string;
    orderedAt: string;

    coupon: CouponOrder;

    status: OrderStatus;
    paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
    paymentType?: string;

    subtotal: number;
    taxAmount: number;
    serviceCharge: number;
    deliveryCharge: number;
    tipAmount: number;
    discountAmount: number;
    discountType?: string;

    estimatedMinutes: number;
    cookingStartedAt: string;
    customerName: string;
    kitchenStatus: KitchenStatus;

    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;

    note: string | null;

    items: OrderItem[];
};

export type OrderUpdateStatus = {
    status: OrderStatus;
    orderNumber: string;
    id: number;
};

export type ModalActionProps = {
    onPay: (value: OrderSummary) => void;
    onPrint: () => void;
};

export type OrderItemType = OrderSummary['items'][number];
