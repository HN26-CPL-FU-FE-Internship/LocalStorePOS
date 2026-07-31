import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getTrendingMenus, type DashboardFilterRequest } from '@/api/dashboard.api';
import { DASHBOARD_QUERY_KEYS } from '@/constants/dashboard';
import type { TrendingMenu } from '@/types';

const useDashboardTrendingMenus = (filter: DashboardFilterRequest = {}, limit = 6) => {
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: [...DASHBOARD_QUERY_KEYS.trendingMenus, filter, limit],
        queryFn: () => getTrendingMenus(filter, limit),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const menus: TrendingMenu[] = (data ?? []).map((item) => ({
        id: String(item.id),
        name: item.name,
        imageUrl: item.imageUrl ?? '',
        orders: item.orders,
        dietType: item.dietType as TrendingMenu['dietType'],
    }));

    return { data: menus, isLoading, isError, isFetching };
};

export default useDashboardTrendingMenus;
