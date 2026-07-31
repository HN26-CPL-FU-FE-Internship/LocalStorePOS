import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getDashboardReservations } from '@/api/dashboard.api';
import { DASHBOARD_QUERY_KEYS } from '@/constants/dashboard';

const useDashboardReservations = (limit = 5) => {
    return useQuery({
        queryKey: [...DASHBOARD_QUERY_KEYS.reservations, limit],
        queryFn: () => getDashboardReservations(limit),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });
};

export default useDashboardReservations;
