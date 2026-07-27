import { KITCHEN_QUERY_KEYS, orderKeys, POS_QUERY_KEYS } from '@/constants';
import { queryClient } from '@/lib';
import posService from '@/services/posService';
import type { PlaceOrder } from '@/types';
import { useMutation } from '@tanstack/react-query';

const useUpdateOrder = () => {
    return useMutation({
        mutationFn: ({
            orderNumber,
            data,
        }: {
            orderNumber: string;
            data: PlaceOrder;
        }) => posService.updateOrder(orderNumber, data),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: POS_QUERY_KEYS.recentOrders(),
                }),
                queryClient.invalidateQueries({
                    queryKey: POS_QUERY_KEYS.tables(),
                }),
                queryClient.invalidateQueries({
                    queryKey: orderKeys.all,
                }),
                queryClient.invalidateQueries({
                    queryKey: KITCHEN_QUERY_KEYS.all,
                }),
            ]);
        },
    });
};

export default useUpdateOrder;
