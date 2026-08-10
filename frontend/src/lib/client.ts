import { Client } from '@stomp/stompjs';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/restaurant-pos/api';

/**
 * Derive the WebSocket broker URL from the REST API base URL so the socket
 * works in every environment (local, tunnel, production) instead of a
 * hard-coded localhost URL.
 *
 * Example: http://localhost:8080/restaurant-pos/api
 *        -> ws://localhost:8080/restaurant-pos/ws
 */
const toWsBrokerUrl = (apiBaseUrl: string): string => {
    const scheme = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
    const hostAndPath = apiBaseUrl.replace(/^https?:\/\//, '').replace(/\/api\/?$/, '');
    return `${scheme}://${hostAndPath}/ws`;
};

const client = new Client({
    brokerURL: toWsBrokerUrl(API_BASE_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
});

export default client;
