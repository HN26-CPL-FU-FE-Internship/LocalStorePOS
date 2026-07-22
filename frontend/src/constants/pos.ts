export const ORDER_TYPES = [
    {
        key: 'dine_in',
        label: 'Dine In',
        icon: 'wine',
        content: 'Dine In',
    },
    {
        key: 'take_away',
        label: 'Take Away',
        icon: 'shopping-bag',
        content: 'Take Away',
    },
    {
        key: 'delivery',
        label: 'Delivery',
        icon: 'check-check',
        content: 'Delivery',
    },
];

export const POS_QUERY_KEYS = {
    all: ['pos'] as const,
    recentOrders: () => ['pos', 'recent-orders'] as const,
    categories: () => ['pos', 'categories'] as const,
    items: (categoryId: number) => ['pos', 'items', { categoryId }] as const,
    waiters: () => ['pos', 'waiters'] as const,
    customers: () => ['pos', 'customers'] as const,
    tables: () => ['pos', 'tables'] as const,
};
