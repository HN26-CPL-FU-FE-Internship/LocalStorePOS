import { describe, it, expect } from 'vitest';
import { calculateDiscount, calculateOrderTotals } from './order';
import type { CouponOrder } from '@/types';

// ─────────────────────────────────────────────────────────────────────
//  calculateDiscount
// ─────────────────────────────────────────────────────────────────────

describe('calculateDiscount', () => {
    describe('percentage type', () => {
        it('returns correct percentage of subtotal', () => {
            expect(calculateDiscount(100, 10, 'percentage')).toBe(10);
        });

        it('rounds to nearest integer', () => {
            expect(calculateDiscount(100, 12.5, 'percentage')).toBe(13); // Math.round(12.5) = 13
        });

        it('caps at 100% even if discount exceeds 100', () => {
            expect(calculateDiscount(50, 200, 'percentage')).toBe(50);
        });

        it('returns 0 for 0% discount', () => {
            expect(calculateDiscount(200, 0, 'percentage')).toBe(0);
        });

        it('returns 0 for 0 subtotal', () => {
            expect(calculateDiscount(0, 10, 'percentage')).toBe(0);
        });

        it('handles negative discount by treating it as 0', () => {
            expect(calculateDiscount(100, -5, 'percentage')).toBe(0);
        });
    });

    describe('fixed_amount type', () => {
        it('returns the discount amount when less than subtotal', () => {
            expect(calculateDiscount(100, 15, 'fixed_amount')).toBe(15);
        });

        it('caps at subtotal when discount exceeds subtotal', () => {
            expect(calculateDiscount(50, 100, 'fixed_amount')).toBe(50);
        });

        it('returns 0 for 0 discount', () => {
            expect(calculateDiscount(100, 0, 'fixed_amount')).toBe(0);
        });

        it('handles negative discount by treating it as 0', () => {
            expect(calculateDiscount(100, -10, 'fixed_amount')).toBe(0);
        });

        it('rounds to nearest integer', () => {
            expect(calculateDiscount(100, 15.75, 'fixed_amount')).toBe(16);
        });
    });

    describe('edge cases', () => {
        it('uses default values when arguments are omitted', () => {
            // @ts-expect-error - testing default parameter behavior
            expect(calculateDiscount()).toBe(0);
        });

        it('handles very small percentages', () => {
            expect(calculateDiscount(1000, 0.5, 'percentage')).toBe(5);
        });

        it('handles zero subtotal with fixed_amount', () => {
            expect(calculateDiscount(0, 50, 'fixed_amount')).toBe(0);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────
//  calculateOrderTotals
// ─────────────────────────────────────────────────────────────────────

describe('calculateOrderTotals', () => {
    const baseParams = {
        subtotal: 100,
        taxAmount: 10,
        discountAmount: 0,
        discountType: 'percentage' as const,
        coupon: null as CouponOrder | null,
        serviceCharge: 5,
        tipAmount: 0,
    };

    it('returns correct values with no modifiers', () => {
        const result = calculateOrderTotals(baseParams);

        // discount 0% = 0, coupon = 0, tax 10% of 100 = 10, service = 5, tip = 0
        expect(result).toEqual({
            discountValue: 0,
            couponDiscount: 0,
            taxValue: 10,
            finalTotal: 115, // 100 - 0 - 0 + 10 + 5 + 0
        });
    });

    it('applies percentage discount correctly', () => {
        const result = calculateOrderTotals({
            ...baseParams,
            discountAmount: 20,
            discountType: 'percentage',
        });

        // 20% of 100 = 20 discount, tax 10% of 100 = 10, service = 5
        expect(result).toEqual({
            discountValue: 20,
            couponDiscount: 0,
            taxValue: 10,
            finalTotal: 95, // 100 - 20 - 0 + 10 + 5 + 0
        });
    });

    it('applies fixed_amount discount correctly', () => {
        const result = calculateOrderTotals({
            ...baseParams,
            discountAmount: 15,
            discountType: 'fixed_amount',
        });

        expect(result).toEqual({
            discountValue: 15,
            couponDiscount: 0,
            taxValue: 10,
            finalTotal: 100, // 100 - 15 - 0 + 10 + 5 + 0
        });
    });

    it('applies coupon discount correctly', () => {
        const result = calculateOrderTotals({
            ...baseParams,
            coupon: { code: 'SAVE10', discountAmount: 10, discountType: 'fixed_amount' },
        });

        expect(result).toEqual({
            discountValue: 0,
            couponDiscount: 10,
            taxValue: 10,
            finalTotal: 105, // 100 - 0 - 10 + 10 + 5 + 0
        });
    });

    it('applies both discount and coupon correctly', () => {
        const result = calculateOrderTotals({
            ...baseParams,
            discountAmount: 10,
            discountType: 'percentage',
            coupon: { code: 'FLAT5', discountAmount: 5, discountType: 'fixed_amount' },
        });

        // 10% of 100 = 10 discount, coupon = 5, tax 10% of 100 = 10, service = 5
        expect(result).toEqual({
            discountValue: 10,
            couponDiscount: 5,
            taxValue: 10,
            finalTotal: 100, // 100 - 10 - 5 + 10 + 5 + 0
        });
    });

    it('applies tip correctly', () => {
        const result = calculateOrderTotals({
            ...baseParams,
            tipAmount: 8,
        });

        expect(result).toEqual({
            discountValue: 0,
            couponDiscount: 0,
            taxValue: 10,
            finalTotal: 123, // 100 - 0 - 0 + 10 + 5 + 8
        });
    });

    it('heavy: combines discount, coupon, and tip', () => {
        const result = calculateOrderTotals({
            subtotal: 200,
            taxAmount: 16,  // pre-computed monetary tax: 8% of 200 = $16
            discountAmount: 15,
            discountType: 'percentage',
            coupon: { code: 'WELCOME', discountAmount: 20, discountType: 'fixed_amount' },
            serviceCharge: 10,
            tipAmount: 12,
        });

        // 15% of 200 = 30 discount, coupon = 20, tax = 16, service = 10, tip = 12
        expect(result).toEqual({
            discountValue: 30,
            couponDiscount: 20,
            taxValue: 16,
            finalTotal: 188, // 200 - 30 - 20 + 16 + 10 + 12
        });
    });

    it('handles zero tax amount', () => {
        const result = calculateOrderTotals({
            ...baseParams,
            taxAmount: 0,
        });

        expect(result).toEqual({
            discountValue: 0,
            couponDiscount: 0,
            taxValue: 0,
            finalTotal: 105, // 100 - 0 - 0 + 0 + 5 + 0
        });
    });

    it('handles null coupon', () => {
        const result = calculateOrderTotals({
            ...baseParams,
            coupon: null,
        });

        expect(result.couponDiscount).toBe(0);
    });

    it('handles large values without overflow', () => {
        const result = calculateOrderTotals({
            subtotal: 999999,
            taxAmount: 100000,  // pre-computed monetary tax: 10% of 999999 ≈ $100000
            discountAmount: 50,
            discountType: 'percentage',
            coupon: { code: 'BIG', discountAmount: 1000, discountType: 'fixed_amount' },
            serviceCharge: 50,
            tipAmount: 100,
        });

        // 50% of 999999 = 499999.5 -> Math.round = 500000
        // coupon = 1000, tax = 100000, service = 50, tip = 100
        // total = 999999 - 500000 - 1000 + 100000 + 50 + 100 = 599149
        expect(result).toEqual({
            discountValue: 500000,
            couponDiscount: 1000,
            taxValue: 100000,
            finalTotal: 599149,
        });
    });
});
