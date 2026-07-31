import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getDashboardStats, getSalesPerformance, type DashboardFilterRequest } from '@/api/dashboard.api';
import { DASHBOARD_QUERY_KEYS } from '@/constants/dashboard';
import type { StatCardData } from '@/types';

const useDashboardStats = (filter: DashboardFilterRequest = {}) => {
    const {
        data: statsData,
        isLoading: statsLoading,
        isError: statsError,
        isFetching: statsFetching,
    } = useQuery({
        queryKey: [...DASHBOARD_QUERY_KEYS.stats, filter],
        queryFn: () => getDashboardStats(filter),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const {
        data: perfData,
        isLoading: perfLoading,
        isError: perfError,
        isFetching: isPerfFetching,
    } = useQuery({
        queryKey: [...DASHBOARD_QUERY_KEYS.salesPerformance, filter],
        queryFn: () => getSalesPerformance(filter),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const isLoading = statsLoading || perfLoading;
    const isError = statsError || perfError;
    const isFetching = statsFetching || isPerfFetching;

    const stats: StatCardData[] = [];

    if (statsData) {
        stats.push({
            id: 'total-orders',
            value: String(statsData.totalOrders),
            change: {
                value: perfData && perfData.length > 0 ? perfData[0].change : '0%',
                trend: perfData && perfData.length > 0 && perfData[0].change.startsWith('+') ? 'up' : 'down',
            },
            label: 'Total Orders',
            icon: 'box',
            color: 'purple',
        });

        stats.push({
            id: 'total-sales',
            value: `$${Number(statsData.totalSales).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: {
                value: perfData && perfData.length > 1 ? perfData[1].change : '0%',
                trend: perfData && perfData.length > 1 && perfData[1].change.startsWith('+') ? 'up' : 'down',
            },
            label: 'Total Sales',
            icon: 'badge-dollar-sign',
            color: 'primary',
        });

        stats.push({
            id: 'average-value',
            value: `$${Number(statsData.averageOrderValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: { value: '0%', trend: 'up' },
            label: 'Average Value',
            icon: 'diamond-percent',
            color: 'orange',
        });

        stats.push({
            id: 'reservations',
            value: String(statsData.totalReservations),
            change: { value: '0%', trend: 'up' },
            label: 'Reservations',
            icon: 'calendar-fold',
            color: 'success',
        });
    }

    return { data: stats, isLoading, isError, isFetching };
};

export default useDashboardStats;
