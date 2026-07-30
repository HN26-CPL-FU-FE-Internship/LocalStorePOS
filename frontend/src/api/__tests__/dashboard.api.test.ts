import { describe, it, expect } from 'vitest';
import { formatLocalDate } from '@/api/dashboard.api';

describe('formatLocalDate', () => {
    it('returns undefined for nullish input', () => {
        expect(formatLocalDate()).toBeUndefined();
        expect(formatLocalDate(undefined)).toBeUndefined();
    });

    it('passes through string values unchanged', () => {
        expect(formatLocalDate('2026-01-15')).toBe('2026-01-15');
    });

    it('returns undefined for empty string', () => {
        expect(formatLocalDate('')).toBeUndefined();
    });

    it('formats Date object to YYYY-MM-DD', () => {
        expect(formatLocalDate(new Date('2026-01-15'))).toBe('2026-01-15');
        expect(formatLocalDate(new Date('2026-12-01'))).toBe('2026-12-01');
    });

    it('pads single-digit month and day with leading zero', () => {
        expect(formatLocalDate(new Date('2026-03-05'))).toBe('2026-03-05');
        expect(formatLocalDate(new Date('2026-01-09'))).toBe('2026-01-09');
    });
});
