import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getRecentActivityLogs, type DashboardFilterRequest } from '@/api/dashboard.api';

export const DASHBOARD_ACTIVITY_LOGS_QUERY_KEY = 'dashboard-activity-logs';

const useDashboardActivityLogs = (filter: DashboardFilterRequest = {}, limit = 20) => {
    return useQuery({
        queryKey: [DASHBOARD_ACTIVITY_LOGS_QUERY_KEY, filter, limit],
        queryFn: () => getRecentActivityLogs(filter, limit),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });
};

export default useDashboardActivityLogs;
