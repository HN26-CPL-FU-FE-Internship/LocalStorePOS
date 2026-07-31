import { DASHBOARD_QUERY_KEYS, KITCHEN_QUERY_KEYS, orderKeys, POS_QUERY_KEYS } from '@/constants';
import { queryClient } from '@/lib';
import type { IMessage } from '@stomp/stompjs';

const handleOrderEvent = (message: IMessage) => {
    const event = JSON.parse(message.body);

    switch (event.type) {
        case 'ORDER_CREATED':
        case 'ORDER_UPDATED':
        case 'ORDER_STATUS_CHANGED':
        case 'PAYMENT_COMPLETED':
        case 'TABLE_UPDATED':
            queryClient.invalidateQueries({
                queryKey: orderKeys.all,
            });
            queryClient.invalidateQueries({
                queryKey: KITCHEN_QUERY_KEYS.all,
            });
            queryClient.invalidateQueries({
                queryKey: POS_QUERY_KEYS.all,
            });
            queryClient.invalidateQueries({
                queryKey: DASHBOARD_QUERY_KEYS.all,
            });
            break;
    }
};

export default handleOrderEvent;
