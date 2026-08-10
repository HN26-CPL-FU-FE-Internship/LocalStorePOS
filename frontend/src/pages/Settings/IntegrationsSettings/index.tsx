import { useCallback, useEffect, useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import { getIntegrations, toggleIntegration, type IntegrationEntry } from '@/api/integration.api';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';

const INTEGRATION_ICONS: Record<string, string> = {
    gmail: 'mail',
    gupshup: 'message-circle',
    printnode: 'printer',
};

const IntegrationsSettingsPage = () => {
    const { showToast } = useContextData(ToastContext);
    const [integrations, setIntegrations] = useState<IntegrationEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [toggling, setToggling] = useState<number | null>(null);

    const loadIntegrations = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getIntegrations();
            setIntegrations(result);
        } catch {
            showToast('error', 'Failed to load integrations.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadIntegrations(); }, [loadIntegrations]);

    const handleToggle = async (id: number) => {
        setToggling(id);
        try {
            const updated = await toggleIntegration(id);
            setIntegrations((prev) => prev.map((i) => (i.id === id ? updated : i)));
            showToast('success', `Integration ${updated.isConnected ? 'connected' : 'disconnected'} successfully.`);
        } catch (err: unknown) {
            showToast('error', err instanceof Error ? err.message : 'Failed to toggle integration.');
        } finally {
            setToggling(null);
        }
    };

    if (loading && integrations.length === 0) {
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
                        Integrations / API
                        <Button variant="white" size="sm" className="btn-icon rounded-circle ms-2" onClick={loadIntegrations}>
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
            </div>


            <Card className="mb-0">
                <Card.Body>
                    <div className="row">
                        {integrations.map((integration) => (
                            <div key={integration.id} className="col-md-12 mb-3">
                                <Card className="payment-type flex-fill">
                                    <Card.Body>
                                        <div className="w-100 d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                <div className="avatar avatar-lg bg-light rounded-circle border p-2 me-2 flex-shrink-0 d-flex align-items-center justify-content-center">
                                                    <Icon name={INTEGRATION_ICONS[integration.providerCode] || 'pin'} className="fs-5" />
                                                </div>
                                                <div>
                                                    <h6 className="fs-14 fw-semibold mb-1">{integration.providerName}</h6>
                                                    <p className="mb-0 text-muted" style={{ fontSize: '0.875rem' }}>
                                                        {integration.providerCode === 'gmail' && 'RESTful API to send, receive, and manage emails.'}
                                                        {integration.providerCode === 'gupshup' && 'Messaging platform (SMS, WhatsApp, RCS).'}
                                                        {integration.providerCode === 'printnode' && 'Middleware agents for cloud-to-local printing.'}
                                                        {!['gmail', 'gupshup', 'printnode'].includes(integration.providerCode) && 'Third-party integration.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="form-check form-switch mb-0">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        id={`switch-integration-${integration.id}`}
                                                        checked={integration.isConnected}
                                                        onChange={() => handleToggle(integration.id)}
                                                        disabled={toggling === integration.id}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>
                        ))}

                        {integrations.length === 0 && !loading && (
                            <div className="col-12 text-center py-4 text-muted">No integrations found.</div>
                        )}
                    </div>
                </Card.Body>
            </Card>
        </>
    );
};

export default IntegrationsSettingsPage;
