import { useCallback, useEffect, useState } from 'react';
import { queryClient } from '@/lib';
import { DELIVERY_SETTING_QUERY_KEY } from '@/hooks/pos/useDeliverySetting';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import {
    getDeliverySetting,
    updateDeliverySetting,
    type DeliverySetting,
    type DeliverySettingFormData,
    type DeliveryChargeTypeValue,
} from '@/api/delivery-setting.api';

const CHARGE_TYPES: { value: DeliveryChargeTypeValue; label: string }[] = [
    { value: 'free', label: 'Free Delivery' },
    { value: 'fixed', label: 'Fixed Delivery Charges' },
    { value: 'km_based', label: 'Kilometer Based Delivery Charges' },
];

const DeliverySettingsPage = () => {
    const [setting, setSetting] = useState<DeliverySetting | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [chargeType, setChargeType] = useState<DeliveryChargeTypeValue>('fixed');
    const [freeDeliveryOver, setFreeDeliveryOver] = useState('');
    const [fixedCharge, setFixedCharge] = useState('');
    const [chargePerKm, setChargePerKm] = useState('');
    const [minDeliveryOver, setMinDeliveryOver] = useState('');
    const [minDistanceForFreeKm, setMinDistanceForFreeKm] = useState('');

    const loadSetting = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getDeliverySetting();
            setSetting(result);
            setChargeType((result.deliveryChargeType as DeliveryChargeTypeValue) || 'fixed');
            setFreeDeliveryOver(result.freeDeliveryOver?.toString() || '');
            setFixedCharge(result.fixedCharge?.toString() || '');
            setChargePerKm(result.chargePerKm?.toString() || '');
            setMinDeliveryOver(result.minDeliveryOver?.toString() || '');
            setMinDistanceForFreeKm(result.minDistanceForFreeKm?.toString() || '');
        } catch {
            setError('Failed to load delivery settings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSetting();
    }, [loadSetting]);
    useEffect(() => {
        if (!success) return;
        const t = setTimeout(() => setSuccess(null), 3000);
        return () => clearTimeout(t);
    }, [success]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const payload: DeliverySettingFormData = {
                deliveryChargeType: chargeType,
            };
            if (chargeType === 'free') {
                payload.freeDeliveryOver = parseFloat(freeDeliveryOver) || 0;
            } else if (chargeType === 'fixed') {
                payload.fixedCharge = parseFloat(fixedCharge) || 0;
            } else if (chargeType === 'km_based') {
                payload.chargePerKm = parseFloat(chargePerKm) || 0;
                payload.minDeliveryOver = parseFloat(minDeliveryOver) || 0;
                payload.minDistanceForFreeKm = parseFloat(minDistanceForFreeKm) || 0;
            }
            const updatedSetting = await updateDeliverySetting(payload);
            setSetting(updatedSetting);
            queryClient.setQueryData(DELIVERY_SETTING_QUERY_KEY, updatedSetting);
            setSuccess('Delivery settings updated successfully.');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update delivery settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading && !setting) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-3 mb-4">
                <div className="flex-grow-1">
                    <h3 className="mb-0">
                        Delivery Settings
                        <Button
                            variant="white"
                            size="sm"
                            className="btn-icon rounded-circle ms-2"
                            onClick={loadSetting}
                        >
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
            </div>

            {success && (
                <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                    {success}
                </Alert>
            )}
            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            <Card className="mb-0">
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        {/* Charge type selector */}
                        <div className="mb-4">
                            <Form.Label className="fw-bold">Delivery Charge Type</Form.Label>
                            <div className="d-flex gap-3 flex-wrap">
                                {CHARGE_TYPES.map((ct) => (
                                    <Form.Check
                                        key={ct.value}
                                        type="radio"
                                        id={`charge-type-${ct.value}`}
                                        label={ct.label}
                                        name="chargeType"
                                        value={ct.value}
                                        checked={chargeType === ct.value}
                                        onChange={() => setChargeType(ct.value)}
                                    />
                                ))}
                            </div>
                        </div>

                        <hr />

                        {/* Free Delivery */}
                        {chargeType === 'free' && (
                            <Card className="mb-0">
                                <Card.Body>
                                    <h6 className="fw-bold text-dark mb-3">Free Delivery</h6>
                                    <Form.Group className="mb-0">
                                        <Form.Label>
                                            Free Delivery Over ($) <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            value={freeDeliveryOver}
                                            onChange={(e) => setFreeDeliveryOver(e.target.value)}
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Fixed Delivery */}
                        {chargeType === 'fixed' && (
                            <Card className="mb-0">
                                <Card.Body>
                                    <h6 className="fw-bold text-dark mb-3">Fixed Delivery Charges</h6>
                                    <Form.Group className="mb-0">
                                        <Form.Label>
                                            Fixed Delivery Amount (%) <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            value={fixedCharge}
                                            onChange={(e) => setFixedCharge(e.target.value)}
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        )}

                        {/* KM Based Delivery */}
                        {chargeType === 'km_based' && (
                            <Card className="mb-0">
                                <Card.Body>
                                    <h6 className="fw-bold text-dark mb-3">Kilometer Based Delivery Charges</h6>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Per KM Delivery Charge ($) <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            value={chargePerKm}
                                            onChange={(e) => setChargePerKm(e.target.value)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Minimum Delivery Over ($) <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            value={minDeliveryOver}
                                            onChange={(e) => setMinDeliveryOver(e.target.value)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-0">
                                        <Form.Label>
                                            Minimum Distance for Free Delivery (KM){' '}
                                            <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.1"
                                            value={minDistanceForFreeKm}
                                            onChange={(e) => setMinDistanceForFreeKm(e.target.value)}
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        )}

                        <div className="d-flex align-items-center justify-content-end flex-wrap row-gap-2 border-top mt-4 pt-4">
                            <Button variant="light" className="me-2" onClick={loadSetting}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </>
    );
};

export default DeliverySettingsPage;
