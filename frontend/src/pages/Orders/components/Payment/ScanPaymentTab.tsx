import { Form } from 'react-bootstrap';
import qrImg from '@/assets/img/icons/qr-img.svg';

import PaymentExtra from './PaymentExtra';
import PaymentInstruction from './PaymentInstruction';
import AmountPopup from './AmountPopup';
import CouponPopup from './CouponPopup';
import { useState } from 'react';
import type { PaymentTabProps } from './types';

export default function ScanPaymentTab({
    note = '',
    onNoteChange,
    readOnly = false,
    discountAmount,
    discountType,
    onDiscountChange,
    tipAmount,
    onTipChange,
    selectedCoupon,
    onCouponChange,
}: PaymentTabProps) {
    // Popup visibility state (local to this tab)
    const [showDiscount, setShowDiscount] = useState(false);
    const [showTip, setShowTip] = useState(false);
    const [showCoupon, setShowCoupon] = useState(false);

    const discountValueText =
        discountAmount > 0
            ? discountType === 'percentage'
                ? `${discountAmount}%`
                : `$${discountAmount}`
            : undefined;

    const tipValueText = tipAmount > 0 ? `$${tipAmount}` : undefined;
    const couponValueText = selectedCoupon ? `${selectedCoupon.code}` : undefined;

    return (
        <>
            <PaymentExtra
                label="Discount"
                valueText={discountValueText}
                onAdd={!readOnly ? () => setShowDiscount(true) : undefined}
                onRemove={!readOnly ? () => onDiscountChange(0, 'percentage') : undefined}
            />
            <PaymentExtra
                label="Tips"
                valueText={tipValueText}
                onAdd={!readOnly ? () => setShowTip(true) : undefined}
                onRemove={!readOnly ? () => onTipChange(0) : undefined}
            />
            <PaymentExtra
                label="Coupon"
                valueText={couponValueText}
                onAdd={!readOnly ? () => setShowCoupon(true) : undefined}
                onRemove={!readOnly ? () => onCouponChange(null) : undefined}
            />

            <PaymentInstruction image={qrImg} message="Scan with your UPI app to pay" />

            <Form.Group>
                <Form.Label className="fw-semibold">Note</Form.Label>

                <Form.Control
                    as="textarea"
                    rows={4}
                    value={note ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onNoteChange(e.target.value)}
                    readOnly={readOnly}
                />
            </Form.Group>

            {/* Discount popup */}
            <AmountPopup
                key={`discount-${showDiscount}`}
                show={showDiscount}
                onHide={() => setShowDiscount(false)}
                onConfirm={(amount, type) => {
                    onDiscountChange(amount, type ?? 'percentage');
                }}
                title="Add Discount"
                showTypeToggle
                initialAmount={discountAmount}
                initialType={discountType}
            />

            {/* Tips popup */}
            <AmountPopup
                key={`tip-${showTip}`}
                show={showTip}
                onHide={() => setShowTip(false)}
                onConfirm={(amount) => onTipChange(amount)}
                title="Add Tips"
                initialAmount={tipAmount}
            />

            {/* Coupon popup */}
            <CouponPopup
                show={showCoupon}
                onHide={() => setShowCoupon(false)}
                onSelect={(coupon) => onCouponChange(coupon)}
                selectedCode={selectedCoupon?.code}
            />
        </>
    );
}
