import { KITCHEN_QUERY_KEYS } from '@/constants';
import { queryClient } from '@/lib';
import kitchenService from '@/services/kitchenService';
import { useMutation } from '@tanstack/react-query';

export interface StartCookingData {
    id: number;
    estimatedMinutes: number;
}

const useStartCooking = () => {
    return useMutation({
        mutationFn: (data: StartCookingData) => kitchenService.startCooking(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: KITCHEN_QUERY_KEYS.all,
            });
        },
    });
};

export default useStartCooking;
