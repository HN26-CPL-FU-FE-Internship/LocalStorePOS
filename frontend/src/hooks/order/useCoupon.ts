import couponService from '@/services/couponService';
import { useQuery } from '@tanstack/react-query';

const useCoupon = () => {
    return useQuery({
        queryKey: ['coupon'],
        queryFn: () => couponService.getActiveCoupons(),
    });
};

export default useCoupon;
