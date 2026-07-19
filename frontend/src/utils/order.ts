// import type { OrderSummary, OrderUpdateStatus } from '@/types';

import { ALLOWED_TRANSITIONS } from '@/constants';
import type { OrderStatus, OrderSummary } from '@/types';

const orderUtils = {
    // handlePrevUpdateStatus: (
    //     value: string,
    //     order: OrderSummary,
    //     setOrderUpdateStatus: React.Dispatch<React.SetStateAction<OrderUpdateStatus | null>>,
    //     setConfirmModal: React.Dispatch<React.SetStateAction<boolean>>,
    // ) => {
    //     const update: OrderUpdateStatus = {
    //         id: order.id,
    //         orderNumber: order.orderNumber,
    //         status: value,
    //     };
    //     setConfirmModal(true);
    //     setOrderUpdateStatus(update);
    // },
    // handleUpdateStatus: () => {},

    onPay: (order: OrderSummary) => {
        console.log(order);
    },

    onPrint: () => {},

    canTransition: (currentStatus: OrderStatus, nextStatus: OrderStatus): boolean => {
        return ALLOWED_TRANSITIONS[currentStatus].has(nextStatus);
    },
};

export default orderUtils;
