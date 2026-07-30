import { memo } from 'react';
import Chart from 'react-apexcharts';
import Icon from '@/components/common/Icon';
import Skeleton from '@/components/common/Skeleton';
import { DashboardCardShell } from '../common';
import { type TimePeriod } from '@/utils/dashboardFilter';

export interface RevenueCardProps {
    totalRevenue: string;
    chartData: { label: string; value: number }[];
    activeFilter?: TimePeriod;
    onFilterChange?: (period: TimePeriod) => void;
    isLoading?: boolean;
    errorMessage?: string;
}

const RevenueCard = memo(({ totalRevenue, chartData, activeFilter = 'Weekly', onFilterChange, isLoading, errorMessage }: RevenueCardProps) => {
    const chartSeries = [
        {
            name: 'Revenue',
            data: chartData.length > 0 ? chartData.map((pt) => pt.value) : [0],
        },
    ];

    const chartOptions = {
        chart: {
            type: 'area' as const,
            height: 310,
            toolbar: { show: false },
            sparkline: { enabled: false },
            fontFamily: 'Inter, sans-serif',
        },
        colors: ['#6366F1'],
        stroke: { curve: 'smooth' as const, width: 3 },
        fill: {
            type: 'gradient' as const,
            gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [50, 100] },
        },
        dataLabels: { enabled: false },
        grid: { borderColor: '#f1f1f1', strokeDashArray: 4, padding: { left: 0, right: 0 } },
        xaxis: {
            categories: chartData.length > 0 ? chartData.map((pt) => pt.label) : ['--'],
            labels: { style: { fontSize: '12px', colors: '#9ca3af' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { fontSize: '12px', colors: '#9ca3af' },
                formatter: (val: number) => `$${val.toLocaleString()}`,
            },
        },
        tooltip: {
            y: { formatter: (val: number) => `$${val.toLocaleString()}` },
            theme: 'light',
        },
        markers: { size: 5, hover: { size: 7 }, colors: ['#6366F1'], strokeColors: '#fff', strokeWidth: 2 },
    };

    const loadingSkeleton = (
        <>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center">
                    <Skeleton width={44} height={44} borderRadius="12px" className="me-2" />
                    <div>
                        <Skeleton width={90} height={14} className="mb-2" />
                        <Skeleton width={130} height={24} />
                    </div>
                </div>
                <Skeleton width={80} height={14} />
            </div>
            <Skeleton height={310} borderRadius="8px" />
        </>
    );

    return (
        <DashboardCardShell
            icon="dollar-sign"
            title="Total Revenue"
            bodyClassName="pb-0"
            isLoading={isLoading}
            errorMessage={errorMessage}
            loadingSkeleton={loadingSkeleton}
            filterBar={onFilterChange ? { activeFilter, onFilterChange } : undefined}
        >
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                    <div className="revenue-avatar">
                        <Icon name="arrow-up" />
                    </div>
                    <div>
                        <p className="stat-card-label mb-1">Total Revenue</p>
                        <h3 className="stat-card-value mb-0">{totalRevenue}</h3>
                    </div>
                </div>
            </div>
            <div className="mt-1">
                <Chart options={chartOptions} series={chartSeries} type="area" height={310} />
            </div>
        </DashboardCardShell>
    );
});

export default RevenueCard;
