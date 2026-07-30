import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getUserStatistics, type DashboardFilterRequest } from '@/api/dashboard.api';
import type { AvatarStackItem } from '@/types';

export interface DashboardUserStatsData {
    topUser: {
        name: string;
        avatarUrl: string;
        grandTotal: string;
        totalNewUsers: string;
        newUsersChange: string;
    };
    newUserAvatars: AvatarStackItem[];
    newUsersChart: { label: string; value: number }[];
}

const DASHBOARD_USER_STATISTICS_QUERY_KEY = 'dashboard-user-statistics';

const useDashboardUserStatistics = (filter: DashboardFilterRequest = {}) => {
    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: [DASHBOARD_USER_STATISTICS_QUERY_KEY, filter],
        queryFn: () => getUserStatistics(filter),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const result: DashboardUserStatsData = {
        topUser: {
            name: data?.topUserName ?? 'N/A',
            avatarUrl: data?.topUserAvatarUrl ?? '',
            grandTotal: data?.grandTotal ?? '$0.00',
            totalNewUsers: data?.totalNewUsers ?? '0',
            newUsersChange: data?.newUsersChange ?? '0%',
        },
        newUserAvatars: (data?.newUserAvatars ?? []).map((avatar) => ({
            id: String(avatar.id),
            imageUrl: avatar.imageUrl ?? '',
            alt: avatar.alt,
        })),
        newUsersChart:
            data?.newUsersChart?.map((pt) => ({
                label: pt.label,
                value: pt.value,
            })) ?? [],
    };

    return { data: result, isLoading, isError, isFetching };
};

export default useDashboardUserStatistics;
