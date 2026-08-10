import { useCallback, useEffect, useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import { getPaymentMethods, togglePaymentMethod, type PaymentMethod } from '@/api/payment-method.api';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';

const PAYMENT_ICONS: Record<string, string> = {
    cash: 'dollar-sign',
    card: 'credit-card',
    wallet: 'wallet',
    paypal: 'credit-card',
    qr: 'qr-code',
    card_reader: 'credit-card',
    bank: 'landmark',
};

const PaymentSettingsPage = () => {
    const { showToast } = useContextData(ToastContext);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(false);
    const [toggling, setToggling] = useState<number | null>(null);

    const loadMethods = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getPaymentMethods();
            setMethods(result);
        } catch {
            showToast('error', 'Failed to load payment methods.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadMethods(); }, [loadMethods]);


    const handleToggle = async (id: number) => {
        setToggling(id);
        try {
            const updated = await togglePaymentMethod(id);
            setMethods((prev) => prev.map((m) => (m.id === id ? updated : m)));
            showToast('success', `Payment method ${updated.isEnabled ? 'enabled' : 'disabled'} successfully.`);
        } catch (err: unknown) {
            showToast('error', err instanceof Error ? err.message : 'Failed to toggle payment method.');
        } finally {
            setToggling(null);
        }
    };

    if (loading && methods.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            </div>
        );
    }

    return (
        <>
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-3 mb-4">
                <div className="flex-grow-1">
                    <h3 className="mb-0">
                        Payment Types
                        <Button variant="white" size="sm" className="btn-icon rounded-circle ms-2" onClick={loadMethods}>
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
            </div>


            <Card className="mb-0">
                <Card.Body>
                    <div className="row">
                        {methods.map((method) => (
                            <div key={method.id} className="col-md-6 col-lg-4 mb-3">
                                <Card className="flex-fill h-100">
                                    <Card.Body>
                                        <div className="w-100 d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                <div className="avatar-md bg-light p-2 me-2 d-flex align-items-center justify-content-center rounded">
                                                    <Icon name={PAYMENT_ICONS[method.code] || 'circle-dollar-sign'} className="fs-5" />
                                                </div>
                                                <p className="mb-0 text-dark fw-medium">{method.name}</p>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="form-check form-switch mb-0">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        id={`switch-${method.id}`}
                                                        checked={method.isEnabled}
                                                        onChange={() => handleToggle(method.id)}
                                                        disabled={toggling === method.id}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>
                        ))}

                        {methods.length === 0 && !loading && (
                            <div className="col-12 text-center py-4 text-muted">No payment methods found.</div>
                        )}
                    </div>
                </Card.Body>
            </Card>
        </>
    );
};

export default PaymentSettingsPage;
