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
