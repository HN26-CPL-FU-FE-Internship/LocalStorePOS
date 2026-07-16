import type { OrderQuery } from '@/types';

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

export const statuses = ['pending', 'preparing', 'served', 'delivered', 'completed', 'cancelled'];
export const orderKeys = {
    all: ['order'] as const,
    summary: () => ['order', 'summary'] as const,
    summaryList: (query: OrderQuery) => ['order', 'summary', query] as const,
};
