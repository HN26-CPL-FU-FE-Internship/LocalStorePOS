import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getTopSellingItems, type DashboardFilterRequest } from '@/api/dashboard.api';
import type { TopSellingItem, BootstrapVariant } from '@/types';

export const DASHBOARD_TOP_ITEMS_QUERY_KEY = 'dashboard-top-items';

const ITEM_COLORS: BootstrapVariant[] = ['primary', 'primary', 'secondary', 'success', 'purple'];

const useDashboardTopItems = (filter: DashboardFilterRequest = {}, limit = 5) => {
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: [DASHBOARD_TOP_ITEMS_QUERY_KEY, filter, limit],
        queryFn: () => getTopSellingItems(filter, limit),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const maxOrders = data && data.length > 0 ? Math.max(...data.map((item) => item.orders)) : 1;

    const items: TopSellingItem[] = (data ?? []).map((item, index) => ({
        id: `top-item-${item.rank}`,
        rank: item.rank,
        name: item.name,
        imageUrl: item.imageUrl,
        orders: item.orders,
        progressPercent: Math.round((item.orders / maxOrders) * 100),
        color: ITEM_COLORS[index % ITEM_COLORS.length],
    }));

    const highlightText = items.length > 0 ? `Most Ordered : ${items[0].name}` : '';

    return { data: items, highlightText, isLoading, isError, isFetching };
};

export default useDashboardTopItems;
