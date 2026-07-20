import type { KitchenStatus } from '@/types/kitchen';

export const KITCHEN_STATUSES: Record<
    KitchenStatus,
    {
        title: string;
        background: string;
        icon: string;
    }
> = {
    new_order: { title: 'new_order', background: 'bg-gray', icon: 'newspaper' },
    in_kitchen: { title: 'in_kitchen', background: 'bg-secondary', icon: 'package-2' },
    delayed: { title: 'delayed', background: 'bg-warning', icon: 'clock-alert' },
    completed: { title: 'completed', background: 'bg-success', icon: 'check-check' },
    cancelled: { title: 'cancelled', background: 'bg-danger', icon: 'x' },
};
