import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getDashboardReservations } from '@/api/dashboard.api';

export const DASHBOARD_RESERVATIONS_QUERY_KEY = 'dashboard-reservations';

const useDashboardReservations = (limit = 5) => {
    return useQuery({
        queryKey: [DASHBOARD_RESERVATIONS_QUERY_KEY, limit],
        queryFn: () => getDashboardReservations(limit),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });
};

export default useDashboardReservations;
