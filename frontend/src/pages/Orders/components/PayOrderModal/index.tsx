import Icon from '@/components/common/Icon';
import { orderKeys, paymentTypes, POS_QUERY_KEYS } from '@/constants';
import { queryClient } from '@/lib';
import { Alert, Button, Col, Modal, Nav, Row, Tab } from 'react-bootstrap';
import { CardPaymentTab, CashPaymentTab, QrPaymentTab } from '../Payment';
import type { CouponOrder, DiscountType, OrderSummary } from '@/types';
import { calculateOrderTotals } from '@/utils';
import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import ApprovalRequestModal from '@/components/common/ApprovalRequestModal';
import type { PaymentRequest } from '@/services/orderService';
import OrderInfoSection from './OrderInfoSection';
import OrderedMenusSection from './OrderedMenusSection';
import OrderTotalsSection from './OrderTotalsSection';

const PayOrderModal = ({
    show,
    order,
    handleClose,
    onPaymentComplete,
    isPaymentProcessing,
}: {
    show: boolean;
    order: OrderSummary | null;
    handleClose: () => void;
    onPaymentComplete?: (paymentData: PaymentRequest) => void;
    isPaymentProcessing?: boolean;
}) => {
    const { showToast } = useContextData(ToastContext);
    const [activePaymentType, setActivePaymentType] = useState('cash');

    // Payment modifier state (lifted from payment tabs)
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountType, setDiscountType] = useState<DiscountType>('percentage');
    const [tipAmount, setTipAmount] = useState(0);
    const [selectedCoupon, setSelectedCoupon] = useState<CouponOrder | null>(null);
    const [givenAmount, setGivenAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState(order?.note ?? '');
    const [showConfirmPay, setShowConfirmPay] = useState(false);
    const [showDiscountApproval, setShowDiscountApproval] = useState(false);
    const [qrSuccess, setQrSuccess] = useState(false);

    const handleGivenAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Allow only digits and one decimal point
        if (/^\d*\.?\d{0,2}$/.test(raw)) {
            setGivenAmount(raw);
        }
    }, []);

    // Track previous processing state to detect completion
    const prevProcessingRef = useRef(isPaymentProcessing);
    // Keep a ref to the current processing value so callbacks can read it without deps
    const processingRef = useRef(isPaymentProcessing);
    useEffect(() => {
        processingRef.current = isPaymentProcessing;
    }, [isPaymentProcessing]);

    // Reset modifier state when modal opens/closes or order changes
    const handleModalClose = useCallback(() => {
        if (processingRef.current) return; // don't close while payment is in-flight
        setDiscountAmount(0);
        setDiscountType('percentage');
        setTipAmount(0);
        setSelectedCoupon(null);
        setGivenAmount('');
        setPaymentNote('');
        handleClose();
    }, [handleClose]);

    useEffect(() => {
        // When processing transitions from true → false, close all modals
        if (prevProcessingRef.current && !isPaymentProcessing && showConfirmPay) {
            setShowConfirmPay(false);
            handleModalClose();
        }
        prevProcessingRef.current = isPaymentProcessing;
    }, [isPaymentProcessing, showConfirmPay, handleModalClose]);

    // ── Computed totals ──────────────────────────────────────────────
    const subtotal = order?.subtotal ?? 0;

    const DISCOUNT_APPROVAL_THRESHOLD_PERCENT = 20;

    const { discountValue, couponDiscount, finalTotal } = useMemo(() => {
        // Use payment-tab values when set, otherwise fall back to order defaults
        const effectiveDiscountAmount = discountAmount > 0 ? discountAmount : (order?.discountAmount ?? 0);
        const effectiveDiscountType = (discountAmount > 0 ? discountType : 'percentage') as DiscountType;
        const effectiveTip = tipAmount > 0 ? tipAmount : (order?.tipAmount ?? 0);
        const effectiveCoupon = selectedCoupon ?? order?.coupon ?? null;

        return calculateOrderTotals({
            subtotal,
            discountAmount: effectiveDiscountAmount,
            discountType: effectiveDiscountType,
            coupon: effectiveCoupon,
            tipAmount: effectiveTip,
            taxAmount: order?.taxAmount ?? 0,
            serviceCharge: order?.serviceCharge ?? 0,
            deliveryCharge: order?.deliveryCharge ?? 0,
        });
    }, [discountAmount, discountType, tipAmount, selectedCoupon, order, subtotal]);

    const handleConfirmPayment = useCallback(() => {
        if (!order) return;

        // Validate cash payment amount before proceeding
        if (activePaymentType === 'cash') {
            const given = parseFloat(givenAmount);
            if (isNaN(given) || given <= 0) {
                showToast('error', 'Please enter the amount given by the customer');
                return;
            }
            if (given < finalTotal) {
                showToast('error', `Given amount ($${given.toFixed(2)}) is less than the final total ($${finalTotal})`);
                return;
            }
        }

        // For card/scan, given amount is not applicable — always send 0
        const parsedGiven = parseFloat(givenAmount);
        const givenToSend = activePaymentType === 'cash' && !isNaN(parsedGiven) && parsedGiven > 0 ? parsedGiven : 0;

        const paymentData: PaymentRequest = {
            discountAmount,
            discountType,
            tipAmount,
            couponCode: selectedCoupon?.code ?? null,
            paymentType: activePaymentType,
            givenAmount: givenToSend,
            note: paymentNote,
        };

        // A discount equal to or above the threshold requires manager approval
        // before the payment is processed on the system.
        const effectiveDiscountPercent =
            discountType === 'percentage' ? discountAmount : subtotal > 0 ? (discountValue / subtotal) * 100 : 0;
        if (effectiveDiscountPercent >= DISCOUNT_APPROVAL_THRESHOLD_PERCENT) {
            // Close the confirm modal so the approval modal is the only one on screen
            setShowConfirmPay(false);
            setShowDiscountApproval(true);
            return;
        }

        // Trigger mutation but keep modals open during processing
        onPaymentComplete?.(paymentData);
    }, [
        order,
        discountAmount,
        discountType,
        tipAmount,
        selectedCoupon,
        activePaymentType,
        givenAmount,
        finalTotal,
        paymentNote,
        onPaymentComplete,
        showToast,
        subtotal,
        discountValue,
    ]);

    const handleRequestPay = useCallback(() => {
        setShowConfirmPay(true);
    }, []);

    const handleQrPaymentSuccess = useCallback(() => {
        setQrSuccess(true);
        queryClient.invalidateQueries({ queryKey: orderKeys.all });
        queryClient.invalidateQueries({ queryKey: POS_QUERY_KEYS.tables() });
        setTimeout(() => {
            handleModalClose();
        }, 1500);
    }, [handleModalClose]);

    // ── Modifier props shared by all payment tabs ────────────────────
    const paymentModifierProps = {
        discountAmount,
        discountType,
        onDiscountChange: (amount: number, type: DiscountType) => {
            setDiscountAmount(amount);
            setDiscountType(type);
        },
        tipAmount,
        onTipChange: (amount: number) => setTipAmount(amount),
        selectedCoupon,
        onCouponChange: (coupon: CouponOrder | null) => {
            const isNew = coupon?.code !== selectedCoupon?.code;
            setSelectedCoupon(coupon);
            if (coupon && isNew) {
                showToast('success', `Coupon ${coupon.code} applied!`);
            }
        },
    };

    const handleNoteChange = useCallback((note: string) => {
        setPaymentNote(note);
    }, []);

    const isOrderReadOnly = order?.status === 'cancelled' || order?.status === 'completed';

    // Don't render if no order data
    if (!order) return null;

    return (
        <Modal
            show={show}
            onHide={handleModalClose}
            style={{ display: 'block', paddingLeft: '0px' }}
            dialogClassName="modal-dialog-centered modal-lg"
        >
            <Modal.Header className="border-0">
                <Modal.Title>Pay & Complete Order</Modal.Title>
                <Button className="btn-close btn-close-modal" variant="default" onClick={handleModalClose}>
                    <Icon name="x" />
                </Button>
            </Modal.Header>

            <Modal.Body>
                {isOrderReadOnly && (
                    <Alert
                        variant={order.status === 'cancelled' ? 'danger' : 'success'}
                        className="d-flex align-items-center gap-2 py-2 px-3 mb-4"
                    >
                        <Icon
                            name={order.status === 'cancelled' ? 'ban' : 'circle-check-big'}
                            className="fs-5 flex-shrink-0"
                        />
                        <span className="fs-14">
                            This order has been{' '}
                            <strong>{order.status === 'cancelled' ? 'cancelled' : 'completed'}</strong>. View-only mode.
                        </span>
                    </Alert>
                )}

                <div className="p-3 border rounded mb-4">
                    <h3 className="text-center mb-0">Final Total : ${finalTotal}</h3>
                </div>

                <Row className="g-4">
                    <Col lg={6} className="border-end">
                        <OrderInfoSection order={order} />
                        <OrderedMenusSection items={order.items} />
                        <OrderTotalsSection
                            discountValue={discountValue}
                            discountAmount={discountAmount}
                            discountType={discountType}
                            couponDiscount={couponDiscount}
                            tipAmount={tipAmount}
                            order={order}
                            selectedCoupon={selectedCoupon}
                        />
                    </Col>

                    <Col lg={6}>
                        <Tab.Container
                            activeKey={activePaymentType}
                            onSelect={(key) => key && setActivePaymentType(key)}
                        >
                            <div>
                                <h6 className="mb-3">Payment Type</h6>

                                <Nav variant="tabs" fill className="nav-tabs nav-tabs-solid border-0 flex-nowrap mb-4">
                                    {paymentTypes.map((item) => (
                                        <Nav.Item key={item.key}>
                                            <Nav.Link
                                                eventKey={item.key}
                                                className="d-flex align-items-center justify-content-center"
                                            >
                                                <Icon name={item.icon} className="me-1" />
                                                {item.label}
                                            </Nav.Link>
                                        </Nav.Item>
                                    ))}
                                </Nav>

                                <Tab.Content>
                                    <Tab.Pane eventKey="cash">
                                        <CashPaymentTab
                                            note={paymentNote}
                                            onNoteChange={handleNoteChange}
                                            finalTotal={finalTotal}
                                            readOnly={isOrderReadOnly}
                                            givenAmount={givenAmount}
                                            onGivenAmountChange={handleGivenAmountChange}
                                            {...paymentModifierProps}
                                        />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="card">
                                        <CardPaymentTab
                                            note={paymentNote}
                                            onNoteChange={handleNoteChange}
                                            readOnly={isOrderReadOnly}
                                            {...paymentModifierProps}
                                        />
                                    </Tab.Pane>
                                    {/* <Tab.Pane eventKey="scan">
                                        <ScanPaymentTab
                                            note={paymentNote}
                                            onNoteChange={handleNoteChange}
                                            readOnly={isOrderReadOnly}
                                            {...paymentModifierProps}
                                        />
                                    </Tab.Pane> */}
                                    <Tab.Pane eventKey="qr">
                                        <QrPaymentTab
                                            note={paymentNote}
                                            onNoteChange={handleNoteChange}
                                            readOnly={isOrderReadOnly || qrSuccess}
                                            {...paymentModifierProps}
                                            order={order}
                                            finalTotal={finalTotal}
                                            onQrPaymentSuccess={handleQrPaymentSuccess}
                                        />
                                    </Tab.Pane>
                                </Tab.Content>
                            </div>
                        </Tab.Container>
                    </Col>
                </Row>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleModalClose}>
                    Close
                </Button>
                {order.status !== 'cancelled' && order.status !== 'completed' && activePaymentType !== 'qr' && (
                    <Button variant="primary" onClick={handleRequestPay}>
                        Pay & Complete Order
                    </Button>
                )}
            </Modal.Footer>

            {/* Payment confirmation modal */}
            <ConfirmModal
                show={showConfirmPay}
                handleClose={() => setShowConfirmPay(false)}
                type="pay"
                action={handleConfirmPayment}
                data={order.orderNumber}
                actionDisabled={isPaymentProcessing}
            />

            {/* Discount ≥ 20% requires approval before the payment is applied */}
            <ApprovalRequestModal
                show={showDiscountApproval}
                onHide={() => setShowDiscountApproval(false)}
                actionLabel="discount"
                requestType="DISCOUNT_EXCEEDS_THRESHOLD"
                description={`Apply discount ${discountAmount > 0 ? (discountType === 'percentage' ? `${discountAmount}%` : `$${discountAmount}`) : ''} to invoice ${order.orderNumber}`}
                targetType="Order"
                targetId={order.id}
                targetDisplay={order.orderNumber}
                additionalData={JSON.stringify({
                    orderId: order.id,
                    paymentRequest: {
                        discountAmount,
                        discountType,
                        tipAmount,
                        couponCode: selectedCoupon?.code ?? null,
                        paymentType: activePaymentType,
                        givenAmount:
                            activePaymentType === 'cash' && !isNaN(parseFloat(givenAmount)) && parseFloat(givenAmount) > 0
                                ? parseFloat(givenAmount)
                                : 0,
                        note: paymentNote,
                    },
                })}
                onSent={() => {
                    setShowDiscountApproval(false);
                }}
            />
        </Modal>
    );
};

export default memo(PayOrderModal);
