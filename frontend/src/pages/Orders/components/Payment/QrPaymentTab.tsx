import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import PaymentExtra from './PaymentExtra';
import AmountPopup from './AmountPopup';
import CouponPopup from './CouponPopup';
import type { OrderSummary } from '@/types';
import { useCreateQrPayment, useQrPaymentSubscription } from '@/hooks/payment';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import PaymentStatus from '@/components/PaymentStatus';
import type { PaymentTabProps } from './types';

interface QrPaymentTabProps extends PaymentTabProps {
    order: OrderSummary;
    finalTotal: number;
    onQrPaymentSuccess: () => void;
}

export default function QrPaymentTab({
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
    order,
    finalTotal,
    onQrPaymentSuccess,
}: QrPaymentTabProps) {
    const { showToast } = useContextData(ToastContext);
    const createQrPayment = useCreateQrPayment();

    const [showDiscount, setShowDiscount] = useState(false);
    const [showTip, setShowTip] = useState(false);
    const [showCoupon, setShowCoupon] = useState(false);
    const [payment, setPayment] = useState<{
        paymentCode: string;
        amount: number;
        qrContent: string;
        expiresAt: string;
    } | null>(null);
    const [status, setStatus] = useState<string>('Pending');
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

    useEffect(() => {
        if (!payment?.expiresAt || status !== 'Pending') {
            return;
        }

        const updateRemaining = () => {
            const seconds = Math.max(0, Math.ceil((Date.parse(payment.expiresAt) - Date.now()) / 1000));
            setRemainingSeconds(seconds);
            if (seconds === 0) {
                setStatus('Expired');
            }
        };

        updateRemaining();
        const timer = window.setInterval(updateRemaining, 1000);
        return () => window.clearInterval(timer);
    }, [payment?.expiresAt, status]);

    useQrPaymentSubscription(order.id, (message) => {
        if (message.paymentStatus === 'PAID') {
            setStatus('Paid');
            showToast('success', 'Payment successful');
            onQrPaymentSuccess();
        }
    });
    const handleGenerateQr = useCallback(() => {
        if (finalTotal <= 0) {
            showToast('error', 'Final total must be greater than zero');
            return;
        }

        createQrPayment.mutate(
            {
                orderId: order.id,
                payload: {
                    discountAmount,
                    discountType,
                    tipAmount,
                    couponCode: selectedCoupon?.code ?? null,
                    note,
                },
            },
            {
                onSuccess: (data) => {
                    setPayment(data);
                    setStatus('Pending');
                    setRemainingSeconds(Math.max(0, Math.ceil((Date.parse(data.expiresAt) - Date.now()) / 1000)));
                },
                onError: (error) => {
                    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
                    showToast('error', message || 'Failed to create QR payment');
                },
            },
        );
    }, [
        order.id,
        finalTotal,
        discountAmount,
        discountType,
        tipAmount,
        selectedCoupon,
        note,
        createQrPayment,
        showToast,
    ]);

    const discountValueText =
        discountAmount > 0 ? (discountType === 'percentage' ? `${discountAmount}%` : `$${discountAmount}`) : undefined;

    const tipValueText = tipAmount > 0 ? `$${tipAmount}` : undefined;
    const couponValueText = selectedCoupon ? `${selectedCoupon.code}` : undefined;

    return (
        <>
            <PaymentExtra
                label="Discount"
                valueText={discountValueText}
                onAdd={!readOnly && !payment ? () => setShowDiscount(true) : undefined}
                onRemove={!readOnly && !payment ? () => onDiscountChange(0, 'percentage') : undefined}
            />
            <PaymentExtra
                label="Tips"
                valueText={tipValueText}
                onAdd={!readOnly && !payment ? () => setShowTip(true) : undefined}
                onRemove={!readOnly && !payment ? () => onTipChange(0) : undefined}
            />
            <PaymentExtra
                label="Coupon"
                valueText={couponValueText}
                onAdd={!readOnly && !payment ? () => setShowCoupon(true) : undefined}
                onRemove={!readOnly && !payment ? () => onCouponChange(null) : undefined}
            />

            {(!payment || status === 'Expired') && (
                <div className="d-grid mb-3">
                    <Button
                        variant="primary"
                        onClick={handleGenerateQr}
                        disabled={createQrPayment.isPending || finalTotal <= 0}
                    >
                        {createQrPayment.isPending ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Generating QR...
                            </>
                        ) : status === 'Expired' ? (
                            'Generate New QR'
                        ) : (
                            'Generate QR'
                        )}
                    </Button>
                </div>
            )}

            {payment && (
                <div className="text-center">
                    {status !== 'Expired' && (
                        <div className="mb-3">
                            <QRCodeSVG value={payment.qrContent} size={200} />
                        </div>
                    )}
                    <p className="text-muted mb-1">
                        {status === 'Expired'
                            ? 'This QR code has expired. Generate a new QR to continue.'
                            : 'Scan with your banking app to pay'}
                    </p>
                    <h5 className="mb-2">${payment.amount.toFixed(2)}</h5>
                    {remainingSeconds !== null && status !== 'Expired' && (
                        <p className="text-warning mb-2">
                            QR expires in {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:
                            {String(remainingSeconds % 60).padStart(2, '0')}
                        </p>
                    )}
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                        <span>Status:</span>
                        <PaymentStatus status={status} />
                    </div>
                </div>
            )}

            <Form.Group>
                <Form.Label className="fw-semibold">Note</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={4}
                    value={note ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onNoteChange(e.target.value)}
                    readOnly={readOnly || !!payment}
                />
            </Form.Group>

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

            <AmountPopup
                key={String(showTip)}
                show={showTip}
                onHide={() => setShowTip(false)}
                onConfirm={(amount) => onTipChange(amount)}
                title="Add Tips"
                initialAmount={tipAmount}
            />

            <CouponPopup
                show={showCoupon}
                onHide={() => setShowCoupon(false)}
                onSelect={(coupon) => onCouponChange(coupon)}
                selectedCode={selectedCoupon?.code}
            />
        </>
    );
}
