import { orderKeys } from '@/constants';
import orderService from '@/services/orderService';
import type { OrderQuery } from '@/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

const useOrderSummary = (query: OrderQuery) => {
    return useQuery({
        queryKey: orderKeys.summaryList(query),
        queryFn: () => orderService.getOrderSummary(query),
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData,
    });
};

export default useOrderSummary;
