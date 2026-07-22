import { POS_QUERY_KEYS } from '@/constants/pos';
import posService from '@/services/posService';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

const usePOSItems = (categoryId: number = 0) => {
    return useQuery({
        queryKey: POS_QUERY_KEYS.items(categoryId),
        queryFn: () => posService.getMenuItems(categoryId),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 2,
    });
};

export default usePOSItems;
