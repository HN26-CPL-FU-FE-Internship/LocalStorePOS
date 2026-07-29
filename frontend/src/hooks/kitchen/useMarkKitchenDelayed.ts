import { KITCHEN_QUERY_KEYS } from '@/constants';
import { queryClient } from '@/lib';
import kitchenService from '@/services/kitchenService';
import { useMutation } from '@tanstack/react-query';

const useMarkKitchenDelayed = () => {
    return useMutation({
        mutationFn: (id: number) => kitchenService.markKitchenDelayed(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: KITCHEN_QUERY_KEYS.all,
            });
        },
    });
};

export default useMarkKitchenDelayed;
