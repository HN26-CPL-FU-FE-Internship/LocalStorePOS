import { Col, Form, Row } from 'react-bootstrap';
import PaymentExtra from './PaymentExtra';
import AmountPopup from './AmountPopup';
import CouponPopup from './CouponPopup';
import { useState, useMemo } from 'react';
import type { CashPaymentTabProps } from './types';

export default function CashPaymentTab({
    note = '',
    onNoteChange,
    finalTotal = 0,
    readOnly = false,
    givenAmount = '',
    onGivenAmountChange,
    discountAmount,
    discountType,
    onDiscountChange,
    tipAmount,
    onTipChange,
    selectedCoupon,
    onCouponChange,
}: CashPaymentTabProps) {
    const balance = useMemo(() => {
        const given = parseFloat(givenAmount);
        if (isNaN(given) || given <= 0) return '';
        return (given - finalTotal).toFixed(2);
    }, [givenAmount, finalTotal]);

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
            <div className="mb-4">
                <Form.Label>
                    Amount Disbursed <span className="text-danger">*</span>
                </Form.Label>

                <Form.Control
                    type="text"
                    value={`$${finalTotal}`}
                    readOnly
                    className="fw-semibold"
                />
            </div>

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

            <Row>
                <Col md={6}>
                    <div className="mb-4">
                        <Form.Label>
                            Given Amount <span className="text-danger">*</span>
                        </Form.Label>

                        <Form.Control
                            type="text"
                            value={givenAmount}
                            onChange={onGivenAmountChange}
                            placeholder="0.00"
                            readOnly={readOnly}
                        />
                    </div>
                </Col>

                <Col md={6}>
                    <div className="mb-4">
                        <Form.Label>
                            Balance <span className="text-danger">*</span>
                        </Form.Label>

                        <Form.Control
                            type="text"
                            value={balance ? `$${balance}` : '$0.00'}
                            readOnly
                            className={balance ? 'text-success fw-semibold' : ''}
                        />
                    </div>
                </Col>
            </Row>

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
                key={String(showDiscount)}
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
                key={String(showTip)}
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
