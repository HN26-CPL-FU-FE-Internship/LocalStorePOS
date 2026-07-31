import dayjs from 'dayjs';

export const formatHourAndMinute = (value?: string) => {
    if (!value) return '';

    const date = new Date(value);

    if (isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

export const formatDateTimeOrder = (value: string | undefined) => dayjs(value).format('DD/MM/YYYY - hh:mm A');

export const formatDateTimeKitchen = (value: string | undefined) => dayjs(value).format('DD MMM YYYY, hh:mm A');

export const formatDateFilter = (value: number) => dayjs(value).format('YYYY-MM-DD');

export const formatRelativeTime = (value: string | undefined): string => {
    if (!value) return '';
    const now = dayjs();
    const date = dayjs(value);
    const diffMinutes = now.diff(date, 'minute');
    const diffHours = now.diff(date, 'hour');
    const diffDays = now.diff(date, 'day');

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.format('DD/MM/YYYY');
};
