import { client } from '@/lib';
import { handleOrderEvent, handleNotificationEvent } from '@/websocket';
import destinations from '@/websocket/subscribe';

const registerSubscriptions = () => {
    client.subscribe(destinations.orders, handleOrderEvent);
    client.subscribe(destinations.notifications, handleNotificationEvent);

    // thêm các subscribe khác vào đây
};

export default registerSubscriptions;
