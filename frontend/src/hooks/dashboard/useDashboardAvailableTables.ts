import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getAvailableTables } from '@/api/dashboard.api';
import type { TableAvailability } from '@/types';

export const DASHBOARD_AVAILABLE_TABLES_QUERY_KEY = 'dashboard-available-tables';

const useDashboardAvailableTables = (limit = 6) => {
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: [DASHBOARD_AVAILABLE_TABLES_QUERY_KEY, limit],
        queryFn: () => getAvailableTables(limit),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const tables: TableAvailability[] = (data ?? []).map((item) => ({
        id: String(item.id),
        name: item.name,
        guests: item.guests,
        imageUrl: item.imageUrl ?? '/restaurant-pos/src/assets/img/tables/tables-17.svg',
    }));

    return { data: tables, isLoading, isError, isFetching };
};

export default useDashboardAvailableTables;
