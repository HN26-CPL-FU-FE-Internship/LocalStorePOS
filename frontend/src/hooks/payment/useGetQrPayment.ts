import { useQuery } from '@tanstack/react-query';
import { getQrPaymentInfo } from '@/api/payment.api';

const QR_PAYMENT_QUERY_KEY = 'qr-payment';

const useGetQrPayment = (paymentCode: string | null) => {
    return useQuery({
        queryKey: [QR_PAYMENT_QUERY_KEY, paymentCode],
        queryFn: () => getQrPaymentInfo(paymentCode as string),
        enabled: !!paymentCode,
        staleTime: 1000 * 30,
    });
};

export default useGetQrPayment;
