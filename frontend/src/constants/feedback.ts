import type { FeedbackType } from '@/types';

export const FEEDBACK_CONFIG: Record<
    FeedbackType,
    {
        icon: string;
        iconClass: string;
        backgroundClass: string;
        buttonVariant: string;
    }
> = {
    success: {
        icon: 'circle-check-big',
        iconClass: 'text-success',
        backgroundClass: 'bg-success-subtle',
        buttonVariant: 'success',
    },
    error: {
        icon: 'circle-x',
        iconClass: 'text-danger',
        backgroundClass: 'bg-danger-subtle',
        buttonVariant: 'danger',
    },
    warning: {
        icon: 'triangle-alert',
        iconClass: 'text-warning',
        backgroundClass: 'bg-warning-subtle',
        buttonVariant: 'warning',
    },
    info: {
        icon: 'circle-info',
        iconClass: 'text-info',
        backgroundClass: 'bg-info-subtle',
        buttonVariant: 'info',
    },
};
