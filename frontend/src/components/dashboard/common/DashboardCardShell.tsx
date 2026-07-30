import { memo, type ReactNode } from 'react';
import SectionCard from '@/components/common/SectionCard';
import type { TimePeriod } from '@/utils/dashboardFilter';
import DashboardFilterBar from './DashboardFilterBar';

export interface DashboardCardShellProps {
    /** Icon name for the card header */
    icon: string;
    /** Card title */
    title: string;
    /** Loading state - shows skeleton when true */
    isLoading?: boolean;
    /** Error message - shows error state when provided */
    errorMessage?: string;
    /** Empty message - shows empty state when data is empty and no error */
    emptyMessage?: string;
    /** Whether to check for empty data (requires dataLength) */
    isEmpty?: boolean;
    /** Custom loading skeleton content */
    loadingSkeleton?: ReactNode;
    /** Card body className */
    bodyClassName?: string;
    /** Action button config for the card header */
    action?: { label: string; href: string };
    /** Filter options for SectionCard header dropdown */
    filterOptions?: Array<{ label: string; onSelect?: () => void }>;
    /** Active filter label for SectionCard header */
    activeFilterLabel?: string;
    /** Filter bar props - renders DashboardFilterBar if provided */
    filterBar?: {
        activeFilter: TimePeriod;
        onFilterChange: (period: TimePeriod) => void;
    };
    /** Main card content */
    children: ReactNode;
}

/**
 * DashboardCardShell wraps SectionCard with consistent loading/error/empty states.
 *
 * Usage:
 * ```tsx
 * <DashboardCardShell
 *   icon="dollar-sign"
 *   title="Revenue"
 *   isLoading={loading}
 *   errorMessage={error ? 'Failed' : undefined}
 *   isEmpty={data.length === 0}
 *   emptyMessage="No data"
 * >
 *   <YourContent />
 * </DashboardCardShell>
 * ```
 */
const DashboardCardShell = memo(({
    icon,
    title,
    isLoading,
    errorMessage,
    emptyMessage,
    isEmpty,
    loadingSkeleton,
    bodyClassName,
    action,
    filterOptions,
    activeFilterLabel,
    filterBar,
    children,
}: DashboardCardShellProps) => {
    // ── Loading state ──────────────────────────────────────────────
    if (isLoading) {
        return (
            <SectionCard icon={icon} title={title} bodyClassName={bodyClassName}>
                {loadingSkeleton ?? (
                    <div className="dashboard-empty-state">Loading...</div>
                )}
            </SectionCard>
        );
    }

    // ── Error state ────────────────────────────────────────────────
    if (errorMessage) {
        return (
            <SectionCard icon={icon} title={title} bodyClassName={bodyClassName}>
                <div className="dashboard-error-state">{errorMessage}</div>
            </SectionCard>
        );
    }

    // ── Empty state (only when explicitly marked as empty) ──────────
    if (isEmpty) {
        return (
            <SectionCard icon={icon} title={title} bodyClassName={bodyClassName}>
                <div className="dashboard-empty-state">{emptyMessage ?? `No ${title.toLowerCase()}`}</div>
            </SectionCard>
        );
    }

    // ── Normal render ──────────────────────────────────────────────
    return (
        <SectionCard
            icon={icon}
            title={title}
            bodyClassName={bodyClassName}
            action={action}
            filterOptions={filterOptions}
            activeFilterLabel={activeFilterLabel}
        >
            {filterBar && (
                <DashboardFilterBar
                    activeFilter={filterBar.activeFilter}
                    onFilterChange={filterBar.onFilterChange}
                />
            )}
            {children}
        </SectionCard>
    );
});

export default DashboardCardShell;
