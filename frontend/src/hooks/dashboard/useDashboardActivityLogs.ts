import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getRecentActivityLogs, type DashboardFilterRequest } from '@/api/dashboard.api';
import { DASHBOARD_QUERY_KEYS } from '@/constants/dashboard';

const useDashboardActivityLogs = (filter: DashboardFilterRequest = {}, limit = 20) => {
    return useQuery({
        queryKey: [...DASHBOARD_QUERY_KEYS.activityLogs, filter, limit],
        queryFn: () => getRecentActivityLogs(filter, limit),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });
};

export default useDashboardActivityLogs;
