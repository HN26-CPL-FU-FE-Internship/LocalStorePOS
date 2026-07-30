import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getSalesPerformance, type DashboardFilterRequest } from '@/api/dashboard.api';
import type { SalesSummaryItem } from '@/types';

export const DASHBOARD_SALES_PERFORMANCE_QUERY_KEY = 'dashboard-sales-performance';

const useDashboardSalesPerformance = (filter: DashboardFilterRequest = {}) => {
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: [DASHBOARD_SALES_PERFORMANCE_QUERY_KEY, filter],
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
