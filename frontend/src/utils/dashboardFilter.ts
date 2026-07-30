import type { DashboardFilterRequest } from '@/api/dashboard.api';

export type TimePeriod = 'Weekly' | 'Monthly' | 'Yearly' | 'Custom';

const DAYS_BACK: Record<TimePeriod, number> = {
    Weekly: 7,
    Monthly: 30,
    Yearly: 365,
};

/**
 * Given a period label ("Weekly" | "Monthly" | "Yearly"), return a
 * DashboardFilterRequest with fromDate / toDate computed from today.
 */
export const getDateFilterForPeriod = (period: TimePeriod): DashboardFilterRequest => {
    const now = new Date();
    const toDate = new Date(now);
    toDate.setHours(23, 59, 59, 999);

    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - DAYS_BACK[period]);
    fromDate.setHours(0, 0, 0, 0);

    return {
        fromDate: fromDate.toISOString().slice(0, 10),
        toDate: toDate.toISOString().slice(0, 10),
    };
};
