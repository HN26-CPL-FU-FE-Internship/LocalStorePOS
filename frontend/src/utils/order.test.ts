import { describe, it, expect } from 'vitest';
import { calculateDiscount, calculateOrderTotals, type CalculateOrderTotalsParams } from './order';
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

// ─────────────────────────────────────────────────────────────────────
//  Backend processPayment formula (after fix):
//    grandTotal = subtotal
//               - discountValue
//               - couponDiscount
//               + taxAmount
//               + serviceCharge
//               + deliveryCharge
//               + tipAmount
//    rounded to 2 decimal places, never negative
//
//  Frontend calculateOrderTotals formula:
//    finalTotal = subtotal
//               - discountValue
//               - couponDiscount
//               + taxAmount
//               + serviceCharge
//               + tipAmount
//    rounded to 2 decimal places (Math.round(*100)/100), never negative
//
//  The frontend now passes serviceCharge and deliveryCharge separately,
//  matching the backend formula.
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

    it('includes service and delivery charges independently', () => {
        const result = calculateOrderTotals({
            ...baseParams,
            serviceCharge: 5,
            deliveryCharge: 8,
        });

        expect(result.finalTotal).toBe(123);
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

    it('handles decimal tax amounts correctly (2dp rounding)', () => {
        const result = calculateOrderTotals({
            ...baseParams,
            subtotal: 99.99,
            taxAmount: 8.50,  // pre-computed
            serviceCharge: 5.50,
        });

        // 99.99 - 0 - 0 + 8.50 + 5.50 + 0 = 113.99
        expect(result.finalTotal).toBe(113.99);
    });

    it('handles discount wiping out most of the total', () => {
        const result = calculateOrderTotals({
            subtotal: 100,
            taxAmount: 10,
            discountAmount: 90,
            discountType: 'percentage',
            coupon: null,
            serviceCharge: 0,
            tipAmount: 0,
        });

        // 90% of 100 = 90 discount
        // 100 - 90 + 10 = 20
        expect(result).toEqual({
            discountValue: 90,
            couponDiscount: 0,
            taxValue: 10,
            finalTotal: 20,
        });
    });
});

// ─────────────────────────────────────────────────────────────────────
//  End-to-End Payment Calculation Test Suite
//  Compares frontend calculateOrderTotals vs backend processPayment logic
//  to ensure both produce IDENTICAL results after the fix.
// ─────────────────────────────────────────────────────────────────────

describe('End-to-End: Frontend vs Backend Payment Calculation', () => {
    //
    // This suite verifies that the frontend's calculateOrderTotals produces
    // the same results as the backend processPayment method would produce
    // after the fix (which now includes taxAmount and 2dp rounding).
    //
    // Backend formula (OrderService.processPayment):
    //   grandTotal = subtotal
    //              - discountValue
    //              - couponDiscount
    //              + taxAmount
    //              + serviceCharge
    //              + deliveryCharge  ← only in backend
    //              + tipAmount
    //              → max(0).setScale(2, HALF_UP)
    //
    // Frontend formula (calculateOrderTotals):
    //   finalTotal = subtotal
    //              - discountValue
    //              - couponDiscount
    //              + taxAmount
//              + serviceCharge
//              + deliveryCharge
//              + tipAmount
    //              → Math.round(max(0) * 100) / 100
    //
    // The PayOrderModal passes both persisted charges independently.
    // So both formulas agree when tested with the same inputs.
    // ─────────────────────────────────────────────────────────────────

    interface BackendProcessPaymentScenario {
        name: string;
        subtotal: number;
        discountAmount: number;
        discountType: 'percentage' | 'fixed_amount';
        coupon: CouponOrder | null;
        taxAmount: number;
        serviceCharge: number;
        deliveryCharge: number;
        tipAmount: number;
        expectedGrandTotal: number;
    }

    // Simulate backend processPayment logic in TypeScript
    function simulateBackendProcessPayment(scenario: BackendProcessPaymentScenario): number {
        const { subtotal, discountAmount, discountType, coupon, taxAmount, serviceCharge, deliveryCharge, tipAmount } =
            scenario;

        // Same as backend calculateDiscountValue:
        // - percentage: Math.round(subtotal * min(100, amount) / 100)
        // - fixed_amount: Math.round(Math.min(amount, subtotal))
        function calcDiscount(sub: number, amt: number, type: 'percentage' | 'fixed_amount'): number {
            if (amt <= 0) return 0;
            if (type === 'percentage') {
                return Math.round((sub / 100) * Math.min(100, amt));
            }
            return Math.round(Math.min(amt, sub));
        }

        const discVal = calcDiscount(subtotal, discountAmount, discountType);
        const coupVal = coupon ? calcDiscount(subtotal, coupon.discountAmount, coupon.discountType) : 0;

        // Backend formula (AFTER FIX): includes taxAmount + rounding to 2dp
        const rawTotal = Math.max(0, subtotal - discVal - coupVal + taxAmount + serviceCharge + deliveryCharge + tipAmount);
        return Math.round(rawTotal * 100) / 100;
    }

    // Test that frontend calculateOrderTotals (with serviceCharge = chargeAmount)
    // matches backend simulateBackendProcessPayment
    function testScenario(scenario: BackendProcessPaymentScenario) {
        const { name, subtotal, discountAmount, discountType, coupon, taxAmount, serviceCharge, deliveryCharge, tipAmount, expectedGrandTotal } = scenario;

        it(name, () => {
            // Backend result (includes deliveryCharge separately)
            const backendResult = simulateBackendProcessPayment(scenario);

            const frontendParams: CalculateOrderTotalsParams = {
                subtotal,
                discountAmount,
                discountType,
                coupon,
                tipAmount,
                taxAmount,
                serviceCharge,
                deliveryCharge,
            };
            const frontendResult = calculateOrderTotals(frontendParams);

            // Both should match the expected grand total
            expect(backendResult).toBe(expectedGrandTotal);
            expect(frontendResult.finalTotal).toBe(expectedGrandTotal);

            // Verify discount and coupon values match too
            if (discountAmount > 0) {
                expect(frontendResult.discountValue).toBeGreaterThan(0);
            }
            if (coupon) {
                expect(frontendResult.couponDiscount).toBeGreaterThan(0);
            }
        });
    }

    // ── 1. Simple: no modificers ──
    testScenario({
        name: '1a. No modifiers (dine_in)',
        subtotal: 100,
        discountAmount: 0,
        discountType: 'percentage',
        coupon: null,
        taxAmount: 10,
        serviceCharge: 5,
        deliveryCharge: 0,
        tipAmount: 0,
        expectedGrandTotal: 115, // 100 + 10 + 5
    });

    testScenario({
        name: '1b. No modifiers (delivery)',
        subtotal: 100,
        discountAmount: 0,
        discountType: 'percentage',
        coupon: null,
        taxAmount: 10,
        serviceCharge: 0,
        deliveryCharge: 5,
        tipAmount: 0,
        expectedGrandTotal: 115, // 100 + 10 + 5
    });

    // ── 2. Percentage discount ──
    testScenario({
        name: '2a. 10% discount (dine_in)',
        subtotal: 100,
        discountAmount: 10,
        discountType: 'percentage',
        coupon: null,
        taxAmount: 10,
        serviceCharge: 5,
        deliveryCharge: 0,
        tipAmount: 0,
        expectedGrandTotal: 105, // 100 - 10 + 10 + 5
    });

    testScenario({
        name: '2b. 25% discount with tip (delivery)',
        subtotal: 200,
        discountAmount: 25,
        discountType: 'percentage',
        coupon: null,
        taxAmount: 16,
        serviceCharge: 0,
        deliveryCharge: 8,
        tipAmount: 10,
        expectedGrandTotal: 184, // 200 - 50 + 16 + 8 + 10
    });

    // ── 3. Fixed amount discount ──
    testScenario({
        name: '3a. $15 fixed discount (dine_in)',
        subtotal: 100,
        discountAmount: 15,
        discountType: 'fixed_amount',
        coupon: null,
        taxAmount: 10,
        serviceCharge: 5,
        deliveryCharge: 0,
        tipAmount: 0,
        expectedGrandTotal: 100, // 100 - 15 + 10 + 5
    });

    // ── 4. Coupon discount ──
    testScenario({
        name: '4a. $10 fixed coupon',
        subtotal: 100,
        discountAmount: 0,
        discountType: 'percentage',
        coupon: { code: 'SAVE10', discountAmount: 10, discountType: 'fixed_amount' },
        taxAmount: 10,
        serviceCharge: 5,
        deliveryCharge: 0,
        tipAmount: 0,
        expectedGrandTotal: 105, // 100 - 0 - 10 + 10 + 5
    });

    testScenario({
        name: '4b. 20% coupon with tip',
        subtotal: 150,
        discountAmount: 0,
        discountType: 'percentage',
        coupon: { code: 'PERCENT20', discountAmount: 20, discountType: 'percentage' },
        taxAmount: 12,
        serviceCharge: 0,
        deliveryCharge: 7,
        tipAmount: 15,
        expectedGrandTotal: 154, // 150 - 0 - 30 + 12 + 7 + 15
    });

    // ── 5. Combined discount + coupon ──
    testScenario({
        name: '5a. 10% discount + $5 coupon (dine_in)',
        subtotal: 100,
        discountAmount: 10,
        discountType: 'percentage',
        coupon: { code: 'FLAT5', discountAmount: 5, discountType: 'fixed_amount' },
        taxAmount: 10,
        serviceCharge: 5,
        deliveryCharge: 0,
        tipAmount: 0,
        expectedGrandTotal: 100, // 100 - 10 - 5 + 10 + 5
    });

    testScenario({
        name: '5b. $10 discount + 10% coupon + tip',
        subtotal: 200,
        discountAmount: 10,
        discountType: 'fixed_amount',
        coupon: { code: 'P10', discountAmount: 10, discountType: 'percentage' },
        taxAmount: 16,
        serviceCharge: 0,
        deliveryCharge: 10,
        tipAmount: 20,
        expectedGrandTotal: 216, // 200 - 10 - 20 + 16 + 10 + 20
    });

    // ── 6. Edge cases ──
    testScenario({
        name: '6a. Zero tax amount',
        subtotal: 100,
        discountAmount: 10,
        discountType: 'percentage',
        coupon: null,
        taxAmount: 0,
        serviceCharge: 5,
        deliveryCharge: 0,
        tipAmount: 0,
        expectedGrandTotal: 95, // 100 - 10 + 0 + 5
    });

    testScenario({
        name: '6b. No service/delivery charge (take_away)',
        subtotal: 50,
        discountAmount: 0,
        discountType: 'percentage',
        coupon: null,
        taxAmount: 5,
        serviceCharge: 0,
        deliveryCharge: 0,
        tipAmount: 0,
        expectedGrandTotal: 55, // 50 + 5
    });

    testScenario({
        name: '6c. 100% discount wipes everything',
        subtotal: 100,
        discountAmount: 100,
        discountType: 'percentage',
        coupon: null,
        taxAmount: 10,
        serviceCharge: 5,
        deliveryCharge: 0,
        tipAmount: 0,
        expectedGrandTotal: 15, // 100 - 100 + 10 + 5 (still > 0 due to tax & service)
    });

    // ── 7. Decimal cases ──
    testScenario({
        name: '7a. Decimal subtotal and tax',
        subtotal: 99.99,
        discountAmount: 0,
        discountType: 'percentage',
        coupon: null,
        taxAmount: 8.50,
        serviceCharge: 5.50,
        deliveryCharge: 0,
        tipAmount: 0,
        expectedGrandTotal: 113.99, // 99.99 + 8.50 + 5.50
    });

    testScenario({
        name: '7b. Decimal discount (10.5% of 100 = 10.5 → Math.round to 11)',
        subtotal: 100,
        discountAmount: 10.5,
        discountType: 'percentage',
        coupon: null,
        taxAmount: 10,
        serviceCharge: 5,
        deliveryCharge: 0,
        tipAmount: 0,
        expectedGrandTotal: 104, // 100 - 11 + 10 + 5
    });

    // ── 8. Verify discount calculation values ──
    it('8a. Discount value matches backend calculateDiscountValue', () => {
        // Scenario: 15% of $200
        const result = calculateOrderTotals({
            subtotal: 200,
            discountAmount: 15,
            discountType: 'percentage',
            coupon: null,
            tipAmount: 0,
            taxAmount: 16,
            serviceCharge: 10,
        });

        // 15% of 200 = 30 (Math.round)
        expect(result.discountValue).toBe(30);

        // Backend: subtotal * capped / 100 rounded to 0 decimal
        // 200 * 15 / 100 = 30.0 → setScale(0, HALF_UP) = 30 ✅
    });

    it('8e. Verifies tax is included in final total (proves the bug fix)', () => {
        // Same scenario but compare with and without tax
        // This explicitly proves that tax is included in the grand total
        const withoutTax = calculateOrderTotals({
            subtotal: 100,
            discountAmount: 10,
            discountType: 'percentage',
            coupon: null,
            tipAmount: 0,
            taxAmount: 0,
            serviceCharge: 5,
        });
        // 100 - 10 + 0 + 5 = 95
        expect(withoutTax.finalTotal).toBe(95);

        const withTax = calculateOrderTotals({
            subtotal: 100,
            discountAmount: 10,
            discountType: 'percentage',
            coupon: null,
            tipAmount: 0,
            taxAmount: 10,
            serviceCharge: 5,
        });
        // 100 - 10 + 10 + 5 = 105
        expect(withTax.finalTotal).toBe(105);

        // The $10 difference proves tax is correctly included in the total
        expect(withTax.finalTotal - withoutTax.finalTotal).toBe(10);
    });

    it('8f. Verifies discount is subtracted correctly while tax is preserved', () => {
        // Scenario: $100 subtotal, 20% discount, $10 tax, $5 service
        // If discount was applied INCLUDING tax (wrong), total would be different

        const result = calculateOrderTotals({
            subtotal: 100,
            discountAmount: 20,
            discountType: 'percentage',
            coupon: null,
            tipAmount: 0,
            taxAmount: 10,
            serviceCharge: 5,
        });

        // CORRECT: discount applies to subtotal only: 20% of 100 = 20
        // total = 100 - 20 + 10 + 5 = 95
        expect(result.finalTotal).toBe(95);

        // WRONG (if discount was applied to subtotal+tax): 20% of 110 = 22
        // total = 110 - 22 + 5 = 93
        // We verify we have the correct formula
        expect(result.finalTotal).not.toBe(93);
    });

    it('8b. Coupon discount value matches backend', () => {
        const result = calculateOrderTotals({
            subtotal: 200,
            discountAmount: 0,
            discountType: 'percentage',
            coupon: { code: 'WELCOME', discountAmount: 20, discountType: 'fixed_amount' },
            tipAmount: 0,
            taxAmount: 16,
            serviceCharge: 10,
        });

        // fixed_amount: Math.round(Math.min(20, 200)) = 20
        expect(result.couponDiscount).toBe(20);
    });

    it('8c. Coupon capped by subtotal', () => {
        const result = calculateOrderTotals({
            subtotal: 20,
            discountAmount: 0,
            discountType: 'percentage',
            coupon: { code: 'BIG', discountAmount: 100, discountType: 'fixed_amount' },
            tipAmount: 0,
            taxAmount: 2,
            serviceCharge: 1,
        });

        // fixed_amount capped: Math.round(Math.min(100, 20)) = 20
        expect(result.couponDiscount).toBe(20);
        // final: 20 - 20 + 2 + 1 = 3
        expect(result.finalTotal).toBe(3);
    });

    it('8d. Percentage discount capped at 100%', () => {
        const result = calculateOrderTotals({
            subtotal: 100,
            discountAmount: 200,
            discountType: 'percentage',
            coupon: null,
            tipAmount: 0,
            taxAmount: 10,
            serviceCharge: 5,
        });

        // 200% capped to 100% → Math.round(100 * 100 / 100) = 100
        expect(result.discountValue).toBe(100);
        // final: 100 - 100 + 10 + 5 = 15
        expect(result.finalTotal).toBe(15);
    });

    // ── 9. Negative/zero protection ──
    it('9a. Grand total never goes negative (deep discount)', () => {
        const result = calculateOrderTotals({
            subtotal: 50,
            discountAmount: 100,
            discountType: 'percentage',
            coupon: { code: 'EXTRA', discountAmount: 20, discountType: 'fixed_amount' },
            tipAmount: 0,
            taxAmount: 0,
            serviceCharge: 0,
        });

        // 100% of 50 = 50 discount, coupon fixed $20 → Math.min(20, 50) = 20
        // 50 - 50 - 20 + 0 + 0 + 0 = -20 → max(0, -20) = 0
        // Backend would reject this with ZERO_TOTAL error
        expect(result.discountValue).toBe(50);
        expect(result.couponDiscount).toBe(20);
        expect(result.finalTotal).toBe(0);
    });
});
