import { KITCHEN_QUERY_KEYS, orderKeys } from '@/constants';
import { queryClient } from '@/lib';
import orderItemService from '@/services/orderItemService';
import { useMutation } from '@tanstack/react-query';

const useUpdateItemStatus = () => {
    return useMutation({
        mutationFn: (data: { id: number; status: string }) => orderItemService.updateOrderItemStatus(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: KITCHEN_QUERY_KEYS.all,
            });
            await queryClient.invalidateQueries({
                queryKey: orderKeys.all,
            });
        },
    });
};

export default useUpdateItemStatus;
