import { useCallback, useEffect, useState } from 'react';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import { getNotificationSetting, updateNotificationSetting, type NotificationSetting, type NotificationSettingFormData } from '@/api/notification-setting.api';

interface ChannelConfig {
    key: 'push' | 'sms' | 'email';
    label: string;
    checked: boolean;
}

interface CategoryConfig {
    label: string;
    channels: ChannelConfig[];
    setter: (push: boolean, sms: boolean, email: boolean) => void;
}

const NotificationsSettingsPage = () => {
    const [setting, setSetting] = useState<NotificationSetting | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [form, setForm] = useState<NotificationSettingFormData>({});

    const loadSetting = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getNotificationSetting();
            setSetting(result);
            setForm({
                mobilePushEnabled: result.mobilePushEnabled,
                desktopEnabled: result.desktopEnabled,
                paymentPush: result.paymentPush,
                paymentSms: result.paymentSms,
                paymentEmail: result.paymentEmail,
                transactionPush: result.transactionPush,
                transactionSms: result.transactionSms,
                transactionEmail: result.transactionEmail,
                activityPush: result.activityPush,
                activitySms: result.activitySms,
                activityEmail: result.activityEmail,
                accountPush: result.accountPush,
                accountSms: result.accountSms,
                accountEmail: result.accountEmail,
            });
        } catch {
            setError('Failed to load notification settings.');
        } finally {
            setLoading(false);
        }
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadSetting(); }, [loadSetting]);
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
            await updateNotificationSetting(form);
            setSuccess('Notification settings updated successfully.');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update notification settings.');
        } finally {
            setSaving(false);
        }
    };

    const updateChannel = (prefix: string, channel: 'push' | 'sms' | 'email', value: boolean) => {
        const field = prefix + channel.charAt(0).toUpperCase() + channel.slice(1);
        setForm((p) => ({ ...p, [field]: value }));
    };

    const categories: CategoryConfig[] = [
        {
            label: 'Payment',
            channels: [
                { key: 'push', label: 'Push', checked: form.paymentPush ?? false },
                { key: 'sms', label: 'SMS', checked: form.paymentSms ?? false },
                { key: 'email', label: 'Email', checked: form.paymentEmail ?? false },
            ],
            setter: (push, sms, email) => setForm((p) => ({ ...p, paymentPush: push, paymentSms: sms, paymentEmail: email })),
        },
        {
            label: 'Transaction',
            channels: [
                { key: 'push', label: 'Push', checked: form.transactionPush ?? false },
                { key: 'sms', label: 'SMS', checked: form.transactionSms ?? false },
                { key: 'email', label: 'Email', checked: form.transactionEmail ?? false },
            ],
            setter: (push, sms, email) => setForm((p) => ({ ...p, transactionPush: push, transactionSms: sms, transactionEmail: email })),
        },
        {
            label: 'Activity',
            channels: [
                { key: 'push', label: 'Push', checked: form.activityPush ?? false },
                { key: 'sms', label: 'SMS', checked: form.activitySms ?? false },
                { key: 'email', label: 'Email', checked: form.activityEmail ?? false },
            ],
            setter: (push, sms, email) => setForm((p) => ({ ...p, activityPush: push, activitySms: sms, activityEmail: email })),
        },
        {
            label: 'Account',
            channels: [
                { key: 'push', label: 'Push', checked: form.accountPush ?? false },
                { key: 'sms', label: 'SMS', checked: form.accountSms ?? false },
                { key: 'email', label: 'Email', checked: form.accountEmail ?? false },
            ],
            setter: (push, sms, email) => setForm((p) => ({ ...p, accountPush: push, accountSms: sms, accountEmail: email })),
        },
    ];

    if (loading && !setting) {
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
                        Notification Settings
                        <Button variant="white" size="sm" className="btn-icon rounded-circle ms-2" onClick={loadSetting}>
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
            </div>

            {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            <Card className="mb-0">
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Card className="mb-3">
                            <Card.Body>
                                <div className="form-check form-switch mb-3 d-flex align-items-center justify-content-between ps-0">
                                    <label className="form-check-label fw-medium text-dark" htmlFor="switch-mobile-push">Mobile Push Notifications</label>
                                    <Form.Check type="switch" id="switch-mobile-push" checked={form.mobilePushEnabled ?? false} onChange={(e) => setForm((p) => ({ ...p, mobilePushEnabled: e.target.checked }))} />
                                </div>
                                <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0">
                                    <label className="form-check-label fw-medium text-dark" htmlFor="switch-desktop">Desktop Notifications</label>
                                    <Form.Check type="switch" id="switch-desktop" checked={form.desktopEnabled ?? false} onChange={(e) => setForm((p) => ({ ...p, desktopEnabled: e.target.checked }))} />
                                </div>
                            </Card.Body>
                        </Card>

                        <h6 className="mb-3">General Notification</h6>

                        <Card className="mb-0">
                            <Card.Body>
                                {categories.map((cat) => (
                                    <div key={cat.label} className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                                        <h6 className="fs-14 fw-medium mb-0">{cat.label}</h6>
                                        <div className="d-flex align-items-center gap-4">
                                            {cat.channels.map((ch) => (
                                                <Form.Check
                                                    key={ch.key}
                                                    type="switch"
                                                    id={`switch-${cat.label.toLowerCase()}-${ch.key}`}
                                                    label={ch.label}
                                                    checked={ch.checked}
                                                    onChange={(e) => updateChannel(
                                                        cat.label.toLowerCase() === 'payment' ? 'payment' :
                                                        cat.label.toLowerCase() === 'transaction' ? 'transaction' :
                                                        cat.label.toLowerCase() === 'activity' ? 'activity' : 'account',
                                                        ch.key,
                                                        e.target.checked
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>

                        <div className="d-flex align-items-center justify-content-end flex-wrap row-gap-2 border-top mt-4 pt-4">
                            <Button variant="light" className="me-2" onClick={loadSetting}>Cancel</Button>
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

export default NotificationsSettingsPage;
