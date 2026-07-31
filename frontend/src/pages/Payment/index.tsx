import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetQrPayment, useConfirmQrPayment, useCancelQrPayment } from '@/hooks/payment';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import PaymentStatus from '@/components/PaymentStatus';
import bindCx from '@/utils/bindCx';
import styles from './Payment.module.scss';

const cx = bindCx(styles);

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

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    // ── Loading State ──
    if (isLoading) {
        return (
            <div className={cx('page')}>
                <div className={cx('card')}>
                    <div className={cx('body')}>
                        <div className={cx('loadingContainer')}>
                            <div className={cx('loadingSpinner')} />
                            <p className={cx('loadingText')}>Loading payment info...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error State ──
    if (isError || !data) {
        return (
            <div className={cx('page')}>
                <div className={cx('card')}>
                    <div className={cx('body')}>
                        <div className={cx('errorSection')}>
                            <div className={cx('errorIcon')}>⚠</div>
                            <h2 className={cx('errorTitle')}>Payment Not Found</h2>
                            <p className={cx('errorMessage')}>
                                {(error as Error)?.message || 'This payment link may have expired or is invalid.'}
                            </p>
                        </div>
                        <div className={cx('actions')}>
                            <button type="button" className={cx('btnCancel')} onClick={handleBack}>
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const statusLabel = data.status
        ? data.status.charAt(0).toUpperCase() + data.status.slice(1)
        : 'Pending';

    const statusDotClass = cx('statusDot', {
        statusDotSuccess: hasPaid,
        statusDotPending: !hasPaid,
    });

    return (
        <div className={cx('page')}>
            <div className={cx('card')}>
                {/* ── Header ── */}
                <div className={cx('header')}>
                    <button type="button" className={cx('headerBack')} onClick={handleBack} aria-label="Go back">
                        ←
                    </button>
                    <span className={cx('headerTitle')}>Confirm Payment</span>
                    <span className={cx('headerAmount')}>${data.amount.toFixed(2)}</span>
                </div>

                {/* ── Body ── */}
                <div className={cx('body')}>
                    {hasPaid ? (
                        /* ── Success State ── */
                        <div className={cx('successSection')}>
                            <div className={cx('successIcon')}>
                                <span className={cx('iconCheck')} />
                            </div>
                            <h2 className={cx('successTitle')}>Payment Successful!</h2>
                            <p className={cx('successSub')}>
                                ${data.amount.toFixed(2)} paid to {data.merchantName}
                            </p>
                            <div className={cx('statusSection')}>
                                <span className={cx('statusDot', 'statusDotSuccess')} />
                                <span className={cx('statusText')}>Completed</span>
                            </div>
                            <div className={cx('actions')}>
                                <button type="button" className={cx('btnCancel')} onClick={handleBack}>
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* ── Merchant Info ── */}
                            <div className={cx('merchantRow')}>
                                <div className={cx('merchantAvatar')}>
                                    {data.merchantName?.charAt(0)?.toUpperCase() || 'M'}
                                </div>
                                <div className={cx('merchantInfo')}>
                                    <div className={cx('merchantName')}>{data.merchantName}</div>
                                    <div className={cx('merchantOrder')}>Order #{data.orderNumber}</div>
                                </div>
                            </div>

                            {/* ── Amount ── */}
                            <div className={cx('amountSection')}>
                                <p className={cx('amountLabel')}>Amount Due</p>
                                <h1 className={cx('amountValue')}>
                                    <span className={cx('amountCurrency')}>$</span>
                                    {data.amount.toFixed(2)}
                                </h1>
                            </div>

                            {/* ── Details ── */}
                            <div className={cx('detailRow')}>
                                <span className={cx('detailLabel')}>Merchant</span>
                                <span className={cx('detailValue')}>{data.merchantName}</span>
                            </div>
                            <div className={cx('detailRow')}>
                                <span className={cx('detailLabel')}>Order Number</span>
                                <span className={cx('detailValue')}>#{data.orderNumber}</span>
                            </div>
                            <div className={cx('detailRow')}>
                                <span className={cx('detailLabel')}>Amount</span>
                                <span className={cx('detailValue')}>${data.amount.toFixed(2)}</span>
                            </div>

                            {/* ── Status ── */}
                            <div className={cx('statusSection')}>
                                <span className={statusDotClass} />
                                <span className={cx('statusText')}>Status: </span>
                                <PaymentStatus status={hasPaid ? 'success' : statusLabel} />
                            </div>

                            {/* ── Actions ── */}
                            <div className={cx('actions')}>
                                <button
                                    type="button"
                                    className={cx('btnPay')}
                                    onClick={handlePay}
                                    disabled={confirm.isPending}
                                >
                                    {confirm.isPending ? (
                                        <>
                                            <span className={cx('btnSpinner')} />
                                            Processing...
                                        </>
                                    ) : (
                                        'Confirm & Pay'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className={cx('btnCancel')}
                                    onClick={handleCancel}
                                    disabled={cancel.isPending}
                                >
                                    {cancel.isPending ? 'Cancelling...' : 'Cancel Payment'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FakeBankPaymentPage;
