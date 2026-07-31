import { useMutation } from '@tanstack/react-query';
import { createQrPayment, type QrPaymentCreateRequest, type QrPaymentResponse } from '@/api/payment.api';

const useCreateQrPayment = () => {
    return useMutation<QrPaymentResponse, Error, { orderId: number; payload: QrPaymentCreateRequest }>({
        mutationFn: ({ orderId, payload }) => createQrPayment(orderId, payload),
    });
};

export default useCreateQrPayment;
