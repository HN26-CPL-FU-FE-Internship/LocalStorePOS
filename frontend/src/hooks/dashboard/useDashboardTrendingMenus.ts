import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getTrendingMenus, type DashboardFilterRequest } from '@/api/dashboard.api';
import type { TrendingMenu } from '@/types';

export const DASHBOARD_TRENDING_MENUS_QUERY_KEY = 'dashboard-trending-menus';

const useDashboardTrendingMenus = (filter: DashboardFilterRequest = {}, limit = 6) => {
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: [DASHBOARD_TRENDING_MENUS_QUERY_KEY, filter, limit],
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
