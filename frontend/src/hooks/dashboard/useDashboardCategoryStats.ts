import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCategoryStats, type DashboardFilterRequest } from '@/api/dashboard.api';
import type { CategoryStat } from '@/types';

export const DASHBOARD_CATEGORY_STATS_QUERY_KEY = 'dashboard-category-stats';

const useDashboardCategoryStats = (filter: DashboardFilterRequest = {}) => {
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: [DASHBOARD_CATEGORY_STATS_QUERY_KEY, filter],
        queryFn: () => getCategoryStats(filter),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const stats: CategoryStat[] = (data ?? []).map((item, index) => ({
        id: `cat-stat-${index}`,
        label: item.label,
        icon: item.icon,
        color: item.color as CategoryStat['color'],
        orders: item.orders,
    }));

    return { data: stats, isLoading, isError, isFetching };
};

export default useDashboardCategoryStats;
