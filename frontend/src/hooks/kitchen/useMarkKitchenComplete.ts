import { KITCHEN_QUERY_KEYS, orderKeys } from '@/constants';
import { queryClient } from '@/lib';
import kitchenService from '@/services/kitchenService';
import { useMutation } from '@tanstack/react-query';

const useMarkKitchenComplete = () => {
    return useMutation({
        mutationFn: (id: number) => kitchenService.markKitchenComplete(id),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: KITCHEN_QUERY_KEYS.all,
                }),
                queryClient.invalidateQueries({
                    queryKey: orderKeys.all,
                }),
            ]);
        },
    });
};

export default useMarkKitchenComplete;
