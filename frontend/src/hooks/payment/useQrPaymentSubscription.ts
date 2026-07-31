import { useEffect, useRef } from 'react';
import { client } from '@/lib';
import type { IMessage } from '@stomp/stompjs';

export interface QrPaymentMessage {
    orderId: number;
    paymentStatus: string;
    paymentId: string;
}

const useQrPaymentSubscription = (orderId: number | null, onMessage: (message: QrPaymentMessage) => void) => {
    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    });

    useEffect(() => {
        if (!orderId) return;

        const destination = `/topic/orders/${orderId}/payment`;
        const subscription = client.subscribe(destination, (message: IMessage) => {
            try {
                const event = JSON.parse(message.body);
                if (event?.type === 'PAYMENT_COMPLETED' && event.data) {
                    onMessageRef.current(event.data as QrPaymentMessage);
                }
            } catch {
                // Ignore malformed WebSocket messages
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [orderId]);
};

export default useQrPaymentSubscription;
