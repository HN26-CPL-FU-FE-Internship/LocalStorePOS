import { ALLOWED_TRANSITIONS } from '@/constants';
import type { CouponOrder, DiscountType, OrderStatus, OrderSummary } from '@/types';

// ── Standalone pure functions ───────────────────────────────────────────

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
    taxAmount: number;
    discountAmount: number;
    discountType: DiscountType;
    coupon: CouponOrder | null;
    serviceCharge: number;
    tipAmount: number;
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
 */
export function calculateOrderTotals(params: CalculateOrderTotalsParams): CalculateOrderTotalsResult {
    const { subtotal, taxAmount, discountAmount, discountType, coupon, serviceCharge, tipAmount } = params;

    const discVal = calculateDiscount(subtotal, discountAmount, discountType);
    const coupVal = coupon ? calculateDiscount(subtotal, coupon.discountAmount, coupon.discountType) : 0;
    const taxVal = calculateDiscount(subtotal, taxAmount, 'percentage');
    const finalTotal = Math.max(0, subtotal - discVal - coupVal + taxVal + serviceCharge + tipAmount);

    return { discountValue: discVal, couponDiscount: coupVal, taxValue: taxVal, finalTotal };
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
