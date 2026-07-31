import { memo } from 'react';
import Chart from 'react-apexcharts';
import Skeleton from '@/components/common/Skeleton';
import AvatarStack from '../../common/AvatarStack';
import Icon from '../../common/Icon';
import { DashboardCardShell } from '../common';
import { type TimePeriod } from '@/utils/dashboardFilter';
import type { AvatarStackItem } from '../../../types';
import { getCategoryImageUrl } from '@/api/category.api';

export interface UserStatisticsCardProps {
    topUser: {
        name: string;
        avatarUrl: string;
        grandTotal: string;
        totalNewUsers: string;
        newUsersChange: string;
    };
    newUserAvatars: AvatarStackItem[];
    newUsersChart?: { label: string; value: number }[];
    activeFilter?: TimePeriod;
    onFilterChange?: (period: TimePeriod) => void;
    isLoading?: boolean;
    errorMessage?: string;
}

const loadingSkeleton = (
    <div className="d-flex align-items-center justify-content-center py-5">
        <Skeleton width={48} height={48} borderRadius="12px" />
    </div>
);

const UserStatisticsCard = memo(({
    topUser,
    newUserAvatars,
    newUsersChart = [],
    activeFilter = 'Weekly',
    onFilterChange,
    isLoading,
    errorMessage,
}: UserStatisticsCardProps) => (
    <DashboardCardShell
        icon="users-round"
        title="User Statistics"
        bodyClassName="d-flex flex-column pb-0"
        isLoading={isLoading}
        errorMessage={errorMessage}
        loadingSkeleton={loadingSkeleton}
        filterBar={onFilterChange ? { activeFilter, onFilterChange } : undefined}
    >
        <div className="user-stat-top-user">
            <div className="d-flex align-items-center gap-3">
                <div className="flex-shrink-0 position-relative">
                    <img
                        src={getCategoryImageUrl(topUser.avatarUrl)}
                        alt="user"
                        className="user-stat-avatar"
                        onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            const fallback = img.nextElementSibling;
                            if (fallback) fallback.classList.remove('d-none');
                        }}
                    />
                    <div className="avatar avatar-xxl avatar-rounded border d-none d-flex align-items-center justify-content-center bg-light">
                        <Icon name="users-round" className="fs-24 text-muted" />
                    </div>
                </div>
                <div>
                    <p className="fs-13 text-muted mb-1">Top User</p>
                    <h6 className="fw-semibold mb-0">{topUser.name}</h6>
                </div>
            </div>
            <div className="text-end">
                <p className="fs-13 text-muted mb-1">Grand Total</p>
                <h6 className="fw-bold mb-0">{topUser.grandTotal}</h6>
            </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-1">
            <div>
                <p className="mb-1 fs-13 text-muted">Total New Users</p>
                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                    {topUser.totalNewUsers}
                    <span className="d-inline-flex align-items-center text-success fs-13 fw-medium">
                        <Icon name="circle-arrow-up" className="me-1" />
                        {topUser.newUsersChange}
                    </span>
                </h5>
            </div>
            <AvatarStack items={newUserAvatars} />
        </div>

        <div className="mt-auto">
            <Chart
                options={{
                    chart: {
                        type: 'area',
                        toolbar: { show: false },
                        sparkline: { enabled: true },
                        fontFamily: 'Inter, sans-serif',
                    },
                    colors: ['#6366F1'],
                    stroke: { curve: 'smooth' as const, width: 2 },
                    fill: {
                        type: 'gradient' as const,
                        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [50, 100] },
                    },
                    dataLabels: { enabled: false },
                    grid: { show: false },
                    xaxis: { axisTicks: { show: false }, axisBorder: { show: false }, labels: { show: false } },
                    yaxis: { show: false },
                    tooltip: { enabled: false },
                }}
                series={[
                    {
                        name: 'New Users',
                        data: newUsersChart.length > 0 ? newUsersChart.map((pt) => pt.value) : [0],
                    },
                ]}
                type="area"
                height={150}
            />
        </div>
    </DashboardCardShell>
));

export default UserStatisticsCard;
