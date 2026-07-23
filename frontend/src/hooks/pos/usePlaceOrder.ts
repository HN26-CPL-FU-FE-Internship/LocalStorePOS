import { KITCHEN_QUERY_KEYS, orderKeys, POS_QUERY_KEYS } from '@/constants';
import { queryClient } from '@/lib';
import posService from '@/services/posService';
import type { PlaceOrder } from '@/types';
import { useMutation } from '@tanstack/react-query';

const usePlaceOrder = () => {
    return useMutation({
        mutationFn: (data: PlaceOrder) => posService.placeOrder(data),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: POS_QUERY_KEYS.recentOrders(),
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

export default usePlaceOrder;
