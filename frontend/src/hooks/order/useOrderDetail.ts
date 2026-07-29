import { orderKeys } from '@/constants';
import orderService from '@/services/orderService';
import type { OrderSummary } from '@/types';
import { useQuery } from '@tanstack/react-query';

const useOrderDetail = (orderNumber: string | null) => {
    return useQuery<OrderSummary>({
        queryKey: [...orderKeys.summary(), { orderNumber }],
        queryFn: () => orderService.getOrderDetail(orderNumber!),
        enabled: !!orderNumber,
        staleTime: 1000 * 60 * 2,
    });
};

export default useOrderDetail;
