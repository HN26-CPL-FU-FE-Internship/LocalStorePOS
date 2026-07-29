import { client } from '@/lib';
import registerSubscriptions from './registerSubscriptions';

const connectWebSocket = () => {
    client.onConnect = () => {
        console.log('Connected');

        registerSubscriptions();
    };

    client.onStompError = (frame) => {
        console.error('Broker error:', frame.headers['message']);
        console.error(frame.body);
    };

    client.onWebSocketError = (event) => {
        console.error('WebSocket error:', event);
    };

    client.activate();
};

export default connectWebSocket;
