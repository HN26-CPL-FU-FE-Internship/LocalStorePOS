import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAssetUrl } from '@/lib/imageUrl';
import { api } from '@/lib/axios';

// getAssetUrl reads the axios instance's baseURL at call time, so mock the
// axios module and control baseURL per test.
vi.mock('@/lib/axios', () => ({
    api: { defaults: { baseURL: undefined as string | undefined } },
}));

const API_BASE = 'http://localhost:8080/restaurant-pos/api';

describe('getAssetUrl', () => {
    beforeEach(() => {
        api.defaults.baseURL = API_BASE;
    });

    describe('falsy paths', () => {
        it('returns undefined for null', () => {
            expect(getAssetUrl(null)).toBeUndefined();
        });

        it('returns undefined for undefined', () => {
            expect(getAssetUrl(undefined)).toBeUndefined();
        });

        it('returns undefined for an empty string', () => {
            expect(getAssetUrl('')).toBeUndefined();
        });
    });

    describe('absolute http(s) URLs', () => {
        it('passes http URLs through untouched', () => {
            const url = 'http://cdn.example.com/img/photo.jpg';
            expect(getAssetUrl(url)).toBe(url);
        });

        it('passes https URLs through untouched', () => {
            const url = 'https://cdn.example.com/uploads/img/items/food-11.jpg';
            expect(getAssetUrl(url)).toBe(url);
        });

        it('passes URLs with a port through untouched', () => {
            const url = 'http://localhost:8080/restaurant-pos/uploads/logo.png';
            expect(getAssetUrl(url)).toBe(url);
        });
    });

    describe('relative paths + baseURL', () => {
        it('prefixes the base URL (with /api stripped) to a /uploads path', () => {
            expect(getAssetUrl('/uploads/img/items/food-11.jpg')).toBe(
                'http://localhost:8080/restaurant-pos/uploads/img/items/food-11.jpg',
            );
        });

        it('prefixes the base URL to a simple relative path', () => {
            expect(getAssetUrl('/logo.png')).toBe('http://localhost:8080/restaurant-pos/logo.png');
        });

        it('strips a trailing slash from the base /api segment', () => {
            api.defaults.baseURL = `${API_BASE}/`;
            expect(getAssetUrl('/uploads/categories/drinks.png')).toBe(
                'http://localhost:8080/restaurant-pos/uploads/categories/drinks.png',
            );
        });

        it('handles a base URL that already excludes /api', () => {
            api.defaults.baseURL = 'http://localhost:8080/restaurant-pos';
            expect(getAssetUrl('/avatar.png')).toBe('http://localhost:8080/restaurant-pos/avatar.png');
        });

        it('returns the path as-is when no base URL is configured', () => {
            api.defaults.baseURL = undefined;
            expect(getAssetUrl('/uploads/x.jpg')).toBe('/uploads/x.jpg');
        });
    });
});
