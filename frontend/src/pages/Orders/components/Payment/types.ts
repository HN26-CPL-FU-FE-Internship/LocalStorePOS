import type { CouponOrder, DiscountType } from '@/types';

/** Common base props for all payment tab components (Cash, Card, Scan). */
export type PaymentTabBaseProps = {
    note: string | null;
    onNoteChange: (note: string) => void;
    readOnly?: boolean;
};

/**
 * Props for controlling discount, tip, and coupon modifiers.
 * Shared across all payment tabs.
 */
export type PaymentTabModifierProps = {
    discountAmount: number;
    discountType: DiscountType;
    onDiscountChange: (amount: number, type: DiscountType) => void;
    tipAmount: number;
    onTipChange: (amount: number) => void;
    selectedCoupon: CouponOrder | null;
    onCouponChange: (coupon: CouponOrder | null) => void;
};

/** Combined props for CardPaymentTab and ScanPaymentTab. */
export type PaymentTabProps = PaymentTabBaseProps & PaymentTabModifierProps;

/** CashPaymentTab adds the finalTotal, givenAmount, and change handler. */
export type CashPaymentTabProps = PaymentTabProps & {
    finalTotal?: number;
    givenAmount?: string;
    onGivenAmountChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};
