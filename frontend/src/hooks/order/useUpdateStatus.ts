import { orderKeys } from '@/constants';
import { queryClient } from '@/lib';
import orderService from '@/services/orderService';
import { useMutation } from '@tanstack/react-query';
import useContextData from '../useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';

const useUpdateStatus = () => {
    const { showToast } = useContextData(ToastContext);
    return useMutation({
        mutationFn: ({ status, id }: { status: string; id: number }) => orderService.updateStatus({ status, id }),

        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: orderKeys.all,
            });
            showToast('success', data.message);
        },
        onError: (error: unknown) => {
            const message =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Something went wrong.';
            showToast('error', message);
        },
    });
};

export default useUpdateStatus;
