import kitchenService from '@/services/kitchenService';
import { useQuery } from '@tanstack/react-query';

const useStatsKitchenStatus = () => {
    return useQuery({
        queryKey: ['kitchen'],
        queryFn: () => kitchenService.getKitchenStats(),
    });
};

export default useStatsKitchenStatus;
