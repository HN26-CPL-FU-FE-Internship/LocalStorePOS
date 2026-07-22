import { POS_QUERY_KEYS } from '@/constants/pos';
import posService from '@/services/posService';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

const useRecentOrders = () => {
    return useQuery({
        queryKey: POS_QUERY_KEYS.recentOrders(),
        queryFn: () => posService.getRecentOrders(),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
    });
};

export default useRecentOrders;
