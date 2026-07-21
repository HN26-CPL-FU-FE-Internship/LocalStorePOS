import type { OrderQuery, OrderStatus, Time } from '@/types';

export const statsIcons = ['bookmark-check', 'circle-arrow-out-down-right', 'loader', 'bike', 'send', 'user'];

export const statsBackgrounds = ['secondary', 'primary', 'orange', 'purple', 'success', 'danger'];

export const paymentTypes = [
    {
        key: 'cash',
        label: 'Cash',
        icon: 'dollar-sign',
        content: 'Cash payment',
    },
    {
        key: 'card',
        label: 'Card',
        icon: 'credit-card',
        content: 'Card payment',
    },
    {
        key: 'scan',
        label: 'Scan',
        icon: 'scan-text',
        content: 'Scan QR payment',
    },
];

export const orderKeys = {
    all: ['order'] as const,
    stats: (query: Time) => ['order', 'stats', query],
    summary: () => ['order', 'summary'] as const,
    summaryList: (query: OrderQuery) => ['order', 'summary', query] as const,
};

export const ORDER_STATUS = {
    PENDING: 'pending',
    PREPARING: 'preparing',
    SERVED: 'served',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
} as const;

export const statuses = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.SERVED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
];

export const ALLOWED_TRANSITIONS: Record<OrderStatus, Set<OrderStatus>> = {
    [ORDER_STATUS.PENDING]: new Set([ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED]),

    [ORDER_STATUS.PREPARING]: new Set([ORDER_STATUS.SERVED, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED]),

    [ORDER_STATUS.SERVED]: new Set([ORDER_STATUS.COMPLETED]),

    [ORDER_STATUS.DELIVERED]: new Set([ORDER_STATUS.COMPLETED]),

    [ORDER_STATUS.COMPLETED]: new Set(),

    [ORDER_STATUS.CANCELLED]: new Set(),
};

export const ORDER_STATUS_ERROR_TITLE: Record<OrderStatus, string> = {
    [ORDER_STATUS.PENDING]: 'The order cannot be updated while it is pending.',
    [ORDER_STATUS.PREPARING]: 'The order cannot be updated while it is being prepared.',
    [ORDER_STATUS.SERVED]: 'The order has already been served.',
    [ORDER_STATUS.DELIVERED]: 'The order has already been delivered.',
    [ORDER_STATUS.COMPLETED]: 'The order has already been completed.',
    [ORDER_STATUS.CANCELLED]: 'The order has already been cancelled.',
};
