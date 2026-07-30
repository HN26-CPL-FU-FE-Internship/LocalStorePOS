import { memo } from 'react';
import Badge from 'react-bootstrap/Badge';
import Chart from 'react-apexcharts';
import Icon from '@/components/common/Icon';
import Skeleton from '@/components/common/Skeleton';
import { DashboardCardShell } from '../common';
import { type TimePeriod } from '@/utils/dashboardFilter';
import type { SalesSummaryItem } from '@/types';

const BAR_COLORS: Record<string, string> = {
    primary: '#6366F1',
    success: '#10B981',
    orange: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    info: '#06B6D4',
};

export interface SalesPerformanceCardProps {
    summary: SalesSummaryItem[];
    activeFilter?: TimePeriod;
    onFilterChange?: (period: TimePeriod) => void;
    isLoading?: boolean;
    errorMessage?: string;
}

const loadingSkeleton = (
    <>
        <Skeleton height={200} borderRadius="8px" className="mb-3" />
        {[1, 2, 3].map((i) => (
            <div key={i} className={`d-flex align-items-center justify-content-between border rounded-3 p-3 ${i < 3 ? 'mb-3' : ''}`}>
                <div className="d-flex align-items-center gap-2">
                    <Skeleton width={40} height={40} borderRadius="10px" className="me-2" />
                    <div>
                        <Skeleton width={70 + i * 8} height={12} className="mb-2" />
                        <Skeleton width={50 + i * 5} height={16} />
                    </div>
                </div>
                <Skeleton width={48} height={22} borderRadius="12px" />
            </div>
        ))}
    </>
);

const SalesPerformanceCard = memo(({ summary, activeFilter = 'Weekly', onFilterChange, isLoading, errorMessage }: SalesPerformanceCardProps) => {
    const isEmpty = !isLoading && !errorMessage && summary.length === 0;

    return (
        <DashboardCardShell
            icon="chart-column-stacked"
            title="Sales Performance"
            isLoading={isLoading}
            errorMessage={errorMessage}
            isEmpty={isEmpty}
            emptyMessage="No data available"
            loadingSkeleton={loadingSkeleton}
            filterBar={onFilterChange ? { activeFilter, onFilterChange } : undefined}
        >
            <div className="mb-3">
                <Chart
                    options={{
                        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
                        colors: summary.map((item) => BAR_COLORS[item.color] ?? '#6366F1'),
                        plotOptions: {
                            bar: { borderRadius: 6, columnWidth: '55%', dataLabels: { position: 'top' } },
                        },
                        dataLabels: { enabled: false },
                        xaxis: {
                            categories: summary.map((item) => item.label),
                            labels: { style: { fontSize: '11px', colors: '#9ca3af' } },
                            axisBorder: { show: false },
                            axisTicks: { show: false },
                        },
                        yaxis: {
                            labels: {
                                style: { fontSize: '11px', colors: '#9ca3af' },
                                formatter: (val: number) => `$${val.toLocaleString()}`,
                            },
                        },
                        grid: { borderColor: '#f1f1f1', strokeDashArray: 4 },
                        tooltip: { y: { formatter: (val: number) => `$${val.toLocaleString()}` }, theme: 'light' },
                        legend: { show: false },
                    }}
                    series={[{
                        name: 'Sales',
                        data: summary.map((item) => {
                            const num = parseFloat(item.value.replace(/[^0-9.]/g, ''));
                            return isNaN(num) ? 0 : num;
                        }),
                    }]}
                    type="bar"
                    height={200}
                />
            </div>

            {summary.map((item) => (
                <div
                    key={item.id}
                    className="sales-perf-item d-flex align-items-center justify-content-between mb-3"
                >
                    <div className="d-flex align-items-center gap-2">
                        <span
                            className={`avatar avatar-md avatar-rounded d-flex align-items-center justify-content-center bg-${item.color}`}
                            style={{ width: 40, height: 40 }}
                        >
                            <Icon name={item.icon} className="fs-16 text-white" />
                        </span>
                        <div>
                            <p className="mb-0 fs-13 text-muted">{item.label}</p>
                            <h6 className="mb-0 fs-15 fw-semibold">{item.value}</h6>
                        </div>
                    </div>
                    <Badge bg="success" pill className="badge-dashboard">
                        {item.change}
                    </Badge>
                </div>
            ))}
        </DashboardCardShell>
    );
});

export default SalesPerformanceCard;
