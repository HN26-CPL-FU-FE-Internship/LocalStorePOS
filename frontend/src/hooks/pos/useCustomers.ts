import { POS_QUERY_KEYS } from '@/constants/pos';
import posService from '@/services/posService';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

const useCustomers = () => {
    return useQuery({
        queryKey: POS_QUERY_KEYS.customers(),
        queryFn: () => posService.getCustomers(),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
    });
};

export default useCustomers;
