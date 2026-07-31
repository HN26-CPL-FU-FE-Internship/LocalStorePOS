import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getRevenueChart, type DashboardFilterRequest } from '@/api/dashboard.api';
import { DASHBOARD_QUERY_KEYS } from '@/constants/dashboard';

const useDashboardRevenueChart = (filter: DashboardFilterRequest = {}) => {
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: [...DASHBOARD_QUERY_KEYS.revenueChart, filter],
        queryFn: () => getRevenueChart(filter),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const totalRevenue =
        data && data.length > 0
            ? `$${data.reduce((sum, pt) => sum + pt.value, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '$0.00';

    return { data: data ?? [], totalRevenue, isLoading, isError, isFetching };
};

export default useDashboardRevenueChart;
