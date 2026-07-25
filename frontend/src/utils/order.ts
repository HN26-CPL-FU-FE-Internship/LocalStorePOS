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
}

export interface CalculateOrderTotalsResult {
    discountValue: number;
    couponDiscount: number;
}

/**
 * Calculate all order totals including discounts, coupon, tax, service charge, and tip.
 * Returns the individual breakdown values plus the final total.
 */
export function calculateOrderTotals(params: CalculateOrderTotalsParams): CalculateOrderTotalsResult {
    const { subtotal, discountAmount, discountType, coupon } = params;

    const discVal = calculateDiscount(subtotal, discountAmount, discountType);
    const coupVal = coupon ? calculateDiscount(subtotal, coupon.discountAmount, coupon.discountType) : 0;

    return { discountValue: discVal, couponDiscount: coupVal };
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
