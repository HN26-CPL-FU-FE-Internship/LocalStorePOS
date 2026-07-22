import { POS_QUERY_KEYS } from '@/constants/pos';
import posService from '@/services/posService';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

const useWaiters = () => {
    return useQuery({
        queryKey: POS_QUERY_KEYS.waiters(),
        queryFn: () => posService.getWaiters(),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
    });
};

export default useWaiters;
