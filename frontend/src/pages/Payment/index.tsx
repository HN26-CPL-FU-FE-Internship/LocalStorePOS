import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { useGetQrPayment, useConfirmQrPayment, useCancelQrPayment } from '@/hooks/payment';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import PaymentStatus from '@/components/PaymentStatus';
import Icon from '@/components/common/Icon';

const FakeBankPaymentPage = () => {
    const { paymentCode } = useParams<{ paymentCode: string }>();
    const navigate = useNavigate();
    const { showToast } = useContextData(ToastContext);

    const { data, isLoading, isError, error } = useGetQrPayment(paymentCode ?? null);
    const confirm = useConfirmQrPayment();
    const cancel = useCancelQrPayment();
    const [hasPaid, setHasPaid] = useState(false);

    const handlePay = useCallback(() => {
        if (!paymentCode || !data) return;

        confirm.mutate(
            { paymentCode, amount: data.amount },
            {
                onSuccess: (response) => {
                    if (response.status === 'SUCCESS') {
                        setHasPaid(true);
                        showToast('success', 'Payment successful');
                    } else {
                        showToast('error', response.message || 'Payment failed');
                    }
                },
                onError: () => {
                    showToast('error', 'Failed to confirm payment');
                },
            },
        );
    }, [paymentCode, data, confirm, showToast]);

    const handleCancel = useCallback(() => {
        if (!paymentCode) return;

        cancel.mutate(paymentCode, {
            onSuccess: () => {
                showToast('info', 'Payment cancelled');
                navigate('/');
            },
            onError: () => {
                showToast('error', 'Failed to cancel payment');
            },
        });
    }, [paymentCode, cancel, navigate, showToast]);

    if (isLoading) {
        return (
            <Container className="d-flex vh-100 align-items-center justify-content-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (isError || !data) {
        return (
            <Container className="d-flex vh-100 align-items-center justify-content-center">
                <Card body className="text-center">
                    <Icon name="circle-alert" className="fs-1 text-danger mb-3" />
                    <h5>Payment not found</h5>
                    <p className="text-muted">{(error as Error)?.message}</p>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="d-flex vh-100 align-items-center justify-content-center">
            <Row className="w-100 justify-content-center">
                <Col md={8} lg={6} xl={5}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4 text-center">
                            <div className="mb-4">
                                <Icon name="building-2" className="fs-1 text-primary mb-2" />
                                <h4 className="mb-0">{data.merchantName}</h4>
                            </div>

                            <div className="mb-4">
                                <p className="text-muted mb-1">Order</p>
                                <h5 className="fw-bold">#{data.orderNumber}</h5>
                            </div>

                            <div className="mb-4">
                                <p className="text-muted mb-1">Amount</p>
                                <h2 className="fw-bold">${data.amount.toFixed(2)}</h2>
                            </div>

                            <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                                <span>Payment status:</span>
                                <PaymentStatus status={hasPaid ? 'success' : data.status} />
                            </div>

                            {!hasPaid && (
                                <div className="d-grid gap-2">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={handlePay}
                                        disabled={confirm.isPending}
                                    >
                                        {confirm.isPending ? (
                                            <>
                                            <Spinner size="sm" className="me-2" />
                                            Processing...
                                            </>
                                        ) : (
                                            'Pay'
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleCancel}
                                        disabled={cancel.isPending}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}

                            {hasPaid && (
                                <div className="mt-3">
                                    <Icon name="circle-check-big" className="fs-1 text-success mb-2" />
                                    <h5 className="text-success">Payment successful</h5>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default FakeBankPaymentPage;
