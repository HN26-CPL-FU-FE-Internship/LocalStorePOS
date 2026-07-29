import { client } from '@/lib';
import { handleOrderEvent } from '@/websocket';
import destinations from '@/websocket/subscribe';

const registerSubscriptions = () => {
    client.subscribe(destinations.orders, handleOrderEvent);

    // thêm các subscribe khác vào đây
};

export default registerSubscriptions;
