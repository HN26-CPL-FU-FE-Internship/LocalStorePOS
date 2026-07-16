import orderService from '@/services/orderService';
import type { Time } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

function useStatsStatus(query: Time) {
    return useQuery({
        queryKey: ['order', 'stats', query],
        queryFn: () => orderService.getOrderStats(query),
        staleTime: 30000,
        placeholderData: keepPreviousData,
    });
}

export default useStatsStatus;
