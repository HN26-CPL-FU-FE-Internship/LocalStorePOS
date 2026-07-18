import type { Time } from '@/types';

export type OrderQuery = Time & {
    status: string;
    page: number;
    size: number;
    orderNumber: string;
};

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

interface OrderItem {
    id: number;
    itemName: string;
    quantity: number;
    kitchenNote: string | null;
    sizeName: string | null;
    addons: OrderItemAddon[];
}

export type OrderSummary = {
    id: number;
    orderNumber: string;
    tokenNo: string;
    orderType: string;
    tableNumber: string;
    orderedAt: string;

    status: string;
    paymentStatus: string;

    subtotal: number;
    taxAmount: number;
    serviceCharge: number;
    deliveryCharge: number;
    tipAmount: number;
    discountAmount: number;

    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;

    note: string | null;

    items: OrderItem[];
};

export type OrderUpdateStatus = {
    status: string;
    orderNumber: string;
    id: number;
};

export type ModalActionProps = {
    onComplete: (value: OrderUpdateStatus) => void;
    onCancel: (value: OrderUpdateStatus) => void;
    onPay: (value: OrderSummary) => void;
    onPrint: () => void;
};
