import { ALLOWED_TRANSITIONS } from '@/constants';
import type { CouponOrder, DiscountType, OrderStatus, OrderSummary } from '@/types';

// ── Standalone pure functions ───────────────────────────────────────────

/**
 * Calculate the price including tax.
 * If no tax rate or tax rate <= 0, returns the original price.
 */
export function calcPriceWithTax(price: number, taxRate: number | null): number {
    if (!taxRate || taxRate <= 0) return price;
    return Math.round(price * (1 + taxRate / 100));
}

/**
 * Calculate the monetary value of a discount/tax based on discount type.
 * For 'percentage': returns (subTotal / 100) * discount, capped at 100%.
 * For 'fixed_amount': returns discount, capped at subTotal.
 */
export function calculateDiscount(subTotal: number = 0, discount: number = 0, type: DiscountType): number {
    if (discount < 0) discount = 0;
    switch (type) {
        case 'percentage':
            return Math.round((subTotal / 100) * Math.min(100, discount));
        case 'fixed_amount':
            return Math.round(Math.min(discount, subTotal));
        default:
            return 0;
    }
}

export interface CalculateOrderTotalsParams {
    subtotal: number;
    discountAmount: number;
    discountType: DiscountType;
    coupon: CouponOrder | null;
    tipAmount: number;
    taxAmount: number;
    serviceCharge: number;
}

export interface CalculateOrderTotalsResult {
    discountValue: number;
    couponDiscount: number;
    taxValue: number;
    finalTotal: number;
}

/**
 * Calculate all order totals including discounts, coupon, tax, service charge, and tip.
 * Returns the individual breakdown values plus the final total.
 *
 * Formula: finalTotal = subtotal - discountValue - couponDiscount + taxValue + serviceCharge + tipAmount
 */
export function calculateOrderTotals(params: CalculateOrderTotalsParams): CalculateOrderTotalsResult {
    const { subtotal, discountAmount, discountType, coupon, tipAmount, taxAmount, serviceCharge } = params;

    const discVal = calculateDiscount(subtotal, discountAmount, discountType);
    const coupVal = coupon ? calculateDiscount(subtotal, coupon.discountAmount, coupon.discountType) : 0;

    // taxAmount is the pre-computed monetary tax value (e.g. $10.00)
    const taxValue = taxAmount;
    const finalTotal = Math.max(
        0,
        subtotal - discVal - coupVal + taxValue + serviceCharge + tipAmount,
    );

    return { discountValue: discVal, couponDiscount: coupVal, taxValue, finalTotal };
}

// ── Utilities object (backward compat for existing imports) ─────────────

const orderUtils = {
    onPay: (order: OrderSummary) => {
        console.log(order);
    },

    onPrint: () => {},

    canTransition: (currentStatus: OrderStatus, nextStatus: OrderStatus): boolean => {
        return ALLOWED_TRANSITIONS[currentStatus].has(nextStatus);
    },

    calculateDiscount,
};

export default orderUtils;
