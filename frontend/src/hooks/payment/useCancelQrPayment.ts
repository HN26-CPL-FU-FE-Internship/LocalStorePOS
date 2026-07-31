import { useMutation } from '@tanstack/react-query';
import { cancelQrPayment, type QrPaymentInfoResponse } from '@/api/payment.api';

const useCancelQrPayment = () => {
    return useMutation<QrPaymentInfoResponse, Error, string>({
        mutationFn: (paymentCode) => cancelQrPayment(paymentCode),
    });
};

export default useCancelQrPayment;
