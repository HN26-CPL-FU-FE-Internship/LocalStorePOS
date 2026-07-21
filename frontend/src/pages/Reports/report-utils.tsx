import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import { formatString } from '@/utils';

export const PAGE_SIZE = 10;

export const sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Ascending', value: 'asc' },
    { label: 'Descending', value: 'desc' },
] as const;

export type SortValue = (typeof sortOptions)[number]['value'];

export const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('DD MMM YYYY');
};

export const formatCurrency = (value: number | undefined | null): string => {
    if (value == null) return '$0.00';
    return `$${Number(value).toFixed(2)}`;
};

export const getStatusBadge = (status: string): ReactNode => {
    const variant =
        status === 'completed' || status === 'paid' || status === 'success' ? 'success' : 'warning';
    return <span className={`badge badge-soft-${variant}`}>{formatString(status)}</span>;
};
