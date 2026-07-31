import { useMutation } from '@tanstack/react-query';
import { confirmQrPayment, type QrPaymentConfirmResponse } from '@/api/payment.api';

const useConfirmQrPayment = () => {
    return useMutation<QrPaymentConfirmResponse, Error, { paymentCode: string; amount: number }>({
        mutationFn: ({ paymentCode, amount }) => confirmQrPayment(paymentCode, { amount }),
    });
};

export default useConfirmQrPayment;
