import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getAvailableTables } from '@/api/dashboard.api';
import { DASHBOARD_QUERY_KEYS } from '@/constants/dashboard';
import tableImages from '@/assets/img/tables';
import type { TableAvailability } from '@/types';

const useDashboardAvailableTables = (limit = 6) => {
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: [...DASHBOARD_QUERY_KEYS.availableTables, limit],
        queryFn: () => getAvailableTables(limit),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const tables: TableAvailability[] = (data ?? []).map((item) => ({
        id: String(item.id),
        name: item.name,
        guests: item.guests,
        imageUrl: item.imageUrl ?? tableImages['tables-17'],
    }));

    return { data: tables, isLoading, isError, isFetching };
};

export default useDashboardAvailableTables;
