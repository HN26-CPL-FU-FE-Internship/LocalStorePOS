import { api } from '@/lib/axios';

/**
 * Build a full absolute URL for a backend-relative asset path
 * (e.g. "/uploads/img/items/xxx.jpg"). Absolute http(s) URLs pass
 * through untouched; null/empty paths return `undefined` so callers can
 * fall back to a placeholder image.
 *
 * Shared by every entity image/avatar helper (items, categories, addons,
 * customers, invoices, store, users, dashboard cards, ...).
 */
export const getAssetUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    if (/^https?:\/\//i.test(path) || path.startsWith('//')) return path;

    const base = api.defaults.baseURL?.replace(/\/api\/?$/, '') ?? '';
    return `${base}${path}`;
};
