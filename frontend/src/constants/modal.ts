import type { ConfirmType } from '@/types';

export const CONFIRM_CONFIG: Record<
    ConfirmType,
    {
        icon: string;
        iconColor: string;
        backgroundColor: string;
        title: string;
        message: string;
        buttonText: string;
        buttonVariant: string;
    }
> = {
    delete: {
        icon: 'trash-2',
        iconColor: 'text-danger',
        backgroundColor: 'bg-danger-subtle',
        title: 'Delete Confirmation',
        message: 'Are you sure you want to delete',
        buttonText: 'Delete',
        buttonVariant: 'danger',
    },
    update: {
        icon: 'circle-alert',
        iconColor: 'text-warning',
        backgroundColor: 'bg-warning-subtle',
        title: 'Update Confirmation',
        message: 'Are you sure you want to update',
        buttonText: 'Update',
        buttonVariant: 'warning',
    },
    cancel: {
        icon: 'circle-x',
        iconColor: 'text-danger',
        backgroundColor: 'bg-danger-subtle',
        title: 'Cancel Confirmation',
        message: 'Are you sure you want to cancel',
        buttonText: 'Cancel Order',
        buttonVariant: 'danger',
    },
    complete: {
        icon: 'circle-check-big',
        iconColor: 'text-success',
        backgroundColor: 'bg-success-subtle',
        title: 'Complete Confirmation',
        message: 'Are you sure you want to mark',
        buttonText: 'Complete',
        buttonVariant: 'success',
    },
    pay: {
        icon: 'wallet',
        iconColor: 'text-primary',
        backgroundColor: 'bg-primary-subtle',
        title: 'Payment Confirmation',
        message: 'Are you sure you want to process payment for',
        buttonText: 'Pay Now',
        buttonVariant: 'primary',
    },
};
