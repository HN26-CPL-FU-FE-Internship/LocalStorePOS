import { memo } from 'react';
import Chart from 'react-apexcharts';
import Icon from "../../common/Icon";
import Skeleton from '@/components/common/Skeleton';
import { DashboardCardShell } from '../common';
import { type TimePeriod } from '@/utils/dashboardFilter';
import type { CategoryStat } from "../../../types";

export interface CategoryStatisticsCardProps {
  stats: CategoryStat[];
  activeFilter?: TimePeriod;
  onFilterChange?: (period: TimePeriod) => void;
  isLoading?: boolean;
  errorMessage?: string;
}

const COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

const loadingSkeleton = (
  <>
    <div className="d-flex justify-content-center mb-3">
      <Skeleton width={210} height={210} borderRadius="50%" />
    </div>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="d-flex align-items-center justify-content-between p-2 border-bottom">
        <div className="d-flex align-items-center">
          <Skeleton width={32} height={32} borderRadius="50%" className="me-2" />
          <Skeleton width={80 + i * 10} height={14} />
        </div>
        <Skeleton width={60} height={14} />
      </div>
    ))}
  </>
);

const CategoryStatisticsCard = memo(({ stats, activeFilter = 'Weekly', onFilterChange, isLoading, errorMessage }: CategoryStatisticsCardProps) => {
  const isEmpty = !isLoading && !errorMessage && stats.length === 0;

  return (
    <DashboardCardShell
      icon="croissant"
      title="Category Statistics"
      isLoading={isLoading}
      errorMessage={errorMessage}
      isEmpty={isEmpty}
      emptyMessage="No category data"
      loadingSkeleton={loadingSkeleton}
      filterBar={onFilterChange ? { activeFilter, onFilterChange } : undefined}
    >
      <div className="d-flex justify-content-center mb-3">
        <Chart
          options={{
            chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
            colors: COLORS.slice(0, stats.length),
            labels: stats.map((s) => s.label),
            plotOptions: {
              pie: {
                donut: {
                  size: '72%',
                  labels: {
                    show: true,
                    total: {
                      show: true,
                      label: 'Total Orders',
                      fontSize: '13px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      formatter: () => stats.reduce((sum, s) => sum + s.orders, 0).toString(),
                    },
                  },
                },
              },
            },
            stroke: { width: 3, colors: ['#fff'] },
            legend: { show: false },
            dataLabels: { enabled: false },
            tooltip: { y: { formatter: (val: number) => `${val} orders` } },
            states: { hover: { filter: { type: 'none' } } },
          }}
          series={stats.map((s) => s.orders)}
          type="donut"
          height={210}
        />
      </div>

      {stats.map((stat, index) => (
        <div
          key={stat.id}
          className={`d-flex align-items-center justify-content-between px-2 py-2 ${
            index < stats.length - 1 ? "border-bottom" : "pb-0"
          }`}
        >
          <div className="d-flex align-items-center gap-2">
            <span
              className={`avatar avatar-sm avatar-rounded bg-${stat.color} d-flex align-items-center justify-content-center`}
              style={{ width: 32, height: 32 }}
            >
              <Icon name={stat.icon} className="fs-14" />
            </span>
            <h6 className="fs-13 fw-medium mb-0">{stat.label}</h6>
          </div>
          <p className="fw-semibold mb-0 fs-13">{stat.orders} Orders</p>
        </div>
      ))}        </DashboardCardShell>
    );
});

export default CategoryStatisticsCard;
