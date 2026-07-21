import { isAxiosError } from 'axios';

export const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

export const extractErrorMessage = (err: unknown, fallback: string) => {
    if (isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
        const data = err.response.data as {
            message?: string;
        };

        if (data.message) {
            return data.message;
        }
    }

    return fallback;
};
