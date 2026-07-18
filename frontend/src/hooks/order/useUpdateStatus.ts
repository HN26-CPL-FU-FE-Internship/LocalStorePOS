import { orderKeys } from '@/constants';
import { queryClient } from '@/lib';
import orderService from '@/services/orderService';
import { useMutation } from '@tanstack/react-query';

const useUpdateStatus = () => {
    return useMutation({
        mutationFn: ({ status, id }: { status: string; id: number }) => orderService.updateStatus({ status, id }),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: orderKeys.all,
            });
        },
    });
};

export default useUpdateStatus;
