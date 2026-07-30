import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getActiveOrders } from '@/api/dashboard.api';
import type { ActiveOrder } from '@/types';

export const DASHBOARD_ACTIVE_ORDERS_QUERY_KEY = 'dashboard-active-orders';

const useDashboardActiveOrders = (limit = 5) => {
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: [DASHBOARD_ACTIVE_ORDERS_QUERY_KEY, limit],
        queryFn: () => getActiveOrders(limit),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const orders: ActiveOrder[] = (data ?? []).map((item) => ({
        id: String(item.id),
        customerName: item.customerName,
        avatarUrl: item.avatarUrl,
        type: (item.type as ActiveOrder['type']) ?? 'Dine In',
        tableNo: item.tableNo ?? undefined,
        status: item.status ?? 'Unknown',
        statusVariant: item.statusVariant as ActiveOrder['statusVariant'],
    }));

    return { data: orders, isLoading, isError, isFetching };
};

export default useDashboardActiveOrders;
