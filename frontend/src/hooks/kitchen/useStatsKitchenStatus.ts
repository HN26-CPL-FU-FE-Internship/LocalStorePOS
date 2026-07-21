import { KITCHEN_QUERY_KEYS } from '@/constants';
import kitchenService from '@/services/kitchenService';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

const useStatsKitchenStatus = () => {
    return useQuery({
        queryKey: KITCHEN_QUERY_KEYS.kitchenStats(),
        queryFn: () => kitchenService.getKitchenStats(),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
    });
};

export default useStatsKitchenStatus;
