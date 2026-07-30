import { memo } from 'react';
import { type TimePeriod } from '@/utils/dashboardFilter';

export interface DashboardFilterBarProps {
    activeFilter: TimePeriod;
    onFilterChange: (period: TimePeriod) => void;
    options?: TimePeriod[];
}

const DEFAULT_OPTIONS: TimePeriod[] = ['Weekly', 'Monthly', 'Yearly'];

/**
 * Reusable filter button group for dashboard cards.
 * Renders a segmented control with period options (Weekly / Monthly / Yearly).
 */
const DashboardFilterBar = memo(({
    activeFilter,
    onFilterChange,
    options = DEFAULT_OPTIONS,
}: DashboardFilterBarProps) => (
    <div className="dashboard-filter-group">
        {options.map((period) => (
            <button
                key={period}
                type="button"
                className={`dashboard-filter-btn ${activeFilter === period ? 'active' : ''}`}
                onClick={() => onFilterChange(period)}
            >
                {period}
            </button>
        ))}
    </div>
));

export default DashboardFilterBar;
