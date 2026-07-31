import { queryClient } from '@/lib';
import type { IMessage } from '@stomp/stompjs';

const handleNotificationEvent = (message: IMessage) => {
    try {
        const event = JSON.parse(message.body);

        // Invalidate notification queries to refresh the list and unread count
        queryClient.invalidateQueries({
            queryKey: ['notifications'],
        });
        queryClient.invalidateQueries({
            queryKey: ['notifications', 'unread-count'],
        });

        // If there's an approval request update, also invalidate approval queries
        if (event?.title?.toLowerCase().includes('approval') || event?.title?.toLowerCase().includes('request')) {
            queryClient.invalidateQueries({
                queryKey: ['approval-requests'],
            });
            window.dispatchEvent(new Event('approval-requests-changed'));
        }
    } catch (error) {
        console.error('Failed to parse notification event:', error);
    }
};

export default handleNotificationEvent;
