export type KitchenOrderStat = {
    new_order: number;
    in_kitchen: number;
    delayed: number;
    completed: number;
    cancelled: number;
};

export type KitchenStatus = 'new_order' | 'in_kitchen' | 'delayed' | 'completed' | 'cancelled';
