import { KITCHEN_QUERY_KEYS } from '@/constants';
import kitchenService from '@/services/kitchenService';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

const PAGE_SIZE = 9;

const useKitchenOrder = (page: number = 1) => {
    return useQuery({
        queryKey: KITCHEN_QUERY_KEYS.kitchenOrders(page, PAGE_SIZE),
        queryFn: () => kitchenService.getKitchenOrder(page - 1, PAGE_SIZE),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
    });
};

export { PAGE_SIZE };
export default useKitchenOrder;
