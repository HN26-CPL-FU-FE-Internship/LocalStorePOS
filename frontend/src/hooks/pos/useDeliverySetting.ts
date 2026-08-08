import { getDeliverySetting } from '@/api/delivery-setting.api';
import { useQuery } from '@tanstack/react-query';

export const DELIVERY_SETTING_QUERY_KEY = ['delivery-settings', 'current'] as const;

const useDeliverySetting = () => {
    return useQuery({
        queryKey: DELIVERY_SETTING_QUERY_KEY,
        queryFn: getDeliverySetting,
        staleTime: 1000 * 60,
    });
};

export default useDeliverySetting;
