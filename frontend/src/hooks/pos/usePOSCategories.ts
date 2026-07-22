import { POS_QUERY_KEYS } from '@/constants/pos';
import posService from '@/services/posService';
import type { POSCategory } from '@/types/pos';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

const usePOSCategories = () => {
    return useQuery<POSCategory[]>({
        queryKey: POS_QUERY_KEYS.categories(),
        queryFn: async () => {
            const cats = await posService.getMenuCategories();

            const totalItems = cats.reduce((sum, c) => sum + c.itemCount, 0);
            const allCategory: POSCategory = {
                id: 0,
                name: 'All Menus',
                imagePath: null,
                itemCount: totalItems,
                status: 'active',
                createdAt: '',
                updatedAt: '',
                isAll: true,
            };

            return [allCategory, ...cats];
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
    });
};

export default usePOSCategories;
