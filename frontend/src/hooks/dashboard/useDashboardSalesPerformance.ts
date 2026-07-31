import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getSalesPerformance, type DashboardFilterRequest } from '@/api/dashboard.api';
import { DASHBOARD_QUERY_KEYS } from '@/constants/dashboard';
import type { SalesSummaryItem } from '@/types';

const useDashboardSalesPerformance = (filter: DashboardFilterRequest = {}) => {
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: [...DASHBOARD_QUERY_KEYS.salesPerformance, filter],
        queryFn: () => getSalesPerformance(filter),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const summary: SalesSummaryItem[] = (data ?? []).map((item) => ({
        id: `perf-${item.label.toLowerCase().replace(/\s+/g, '-')}`,
        label: item.label,
        value: item.value,
        change: item.change,
        icon: item.icon,
        color: item.color as SalesSummaryItem['color'],
    }));

    return { data: summary, isLoading, isError, isFetching };
};

export default useDashboardSalesPerformance;
