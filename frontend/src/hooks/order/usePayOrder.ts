import { orderKeys } from '@/constants';
import { queryClient } from '@/lib';
import orderService from '@/services/orderService';
import type { PaymentRequest } from '@/services/orderService';
import { useMutation } from '@tanstack/react-query';
import useContextData from '../useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';

const usePayOrder = () => {
    const { showToast } = useContextData(ToastContext);

    return useMutation({
        mutationFn: ({ id, paymentData }: { id: number; paymentData: PaymentRequest }) =>
            orderService.payOrder({ id, paymentData }),

        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: orderKeys.all,
            });
            showToast('success', data.message);
        },
        onError: (error: unknown) => {
            const message =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Payment failed. Please try again.';
            showToast('error', message);
        },
    });
};

export default usePayOrder;
