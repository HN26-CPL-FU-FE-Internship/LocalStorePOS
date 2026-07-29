import { useCallback, useEffect, useState } from 'react';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import { getPrintSetting, updatePrintSetting, type PrintSetting, type PrintSettingFormData } from '@/api/print-setting.api';

const PAGE_SIZES = ['A1', 'A2', 'A3', 'A4', 'A5', 'Letter', 'Legal', 'Receipt (80mm)', 'Receipt (58mm)'];

const PrintSettingsPage = () => {
    const [setting, setSetting] = useState<PrintSetting | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [form, setForm] = useState<PrintSettingFormData>({});

    const loadSetting = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getPrintSetting();
            setSetting(result);
            setForm({
                enablePrint: result.enablePrint,
                showStoreDetails: result.showStoreDetails,
                showCustomerDetails: result.showCustomerDetails,
                showNotes: result.showNotes,
                printTokens: result.printTokens,
                pageSize: result.pageSize,
                headerText: result.headerText || '',
                footerText: result.footerText || '',
            });
        } catch {
            setError('Failed to load print settings.');
        } finally {
            setLoading(false);
        }
    }, []);

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
            await updatePrintSetting(form);
            setSuccess('Print settings updated successfully.');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update print settings.');
        } finally {
            setSaving(false);
        }
    };

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
                        Print Settings
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
                        <h5 className="mb-3">Print Settings</h5>

                        <div className="row">
                            <div className="col-md-12">
                                <div className="mb-3">
                                    <div className="form-check form-switch mb-3 d-flex align-items-center justify-content-between ps-0">
                                        <label className="form-check-label" htmlFor="switch-enable-print">Enable Print</label>
                                        <Form.Check type="switch" id="switch-enable-print" checked={form.enablePrint ?? false} onChange={(e) => setForm((p) => ({ ...p, enablePrint: e.target.checked }))} />
                                    </div>
                                    <div className="form-check form-switch mb-3 d-flex align-items-center justify-content-between ps-0">
                                        <label className="form-check-label" htmlFor="switch-show-store">Show Store Details</label>
                                        <Form.Check type="switch" id="switch-show-store" checked={form.showStoreDetails ?? false} onChange={(e) => setForm((p) => ({ ...p, showStoreDetails: e.target.checked }))} />
                                    </div>
                                    <div className="form-check form-switch mb-3 d-flex align-items-center justify-content-between ps-0">
                                        <label className="form-check-label" htmlFor="switch-show-customer">Show Customer Details</label>
                                        <Form.Check type="switch" id="switch-show-customer" checked={form.showCustomerDetails ?? false} onChange={(e) => setForm((p) => ({ ...p, showCustomerDetails: e.target.checked }))} />
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-12">
                                <Form.Group className="mb-3">
                                    <Form.Label>Format (Page Size) <span className="text-danger">*</span></Form.Label>
                                    <Form.Select value={form.pageSize || 'A4'} onChange={(e) => setForm((p) => ({ ...p, pageSize: e.target.value }))}>
                                        {PAGE_SIZES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </div>

                            <div className="col-md-12">
                                <Form.Group className="mb-3">
                                    <Form.Label>Header</Form.Label>
                                    <Form.Control as="textarea" rows={3} value={form.headerText || ''} onChange={(e) => setForm((p) => ({ ...p, headerText: e.target.value }))} />
                                </Form.Group>
                            </div>

                            <div className="col-md-12">
                                <Form.Group className="mb-3">
                                    <Form.Label>Footer</Form.Label>
                                    <Form.Control as="textarea" rows={3} value={form.footerText || ''} onChange={(e) => setForm((p) => ({ ...p, footerText: e.target.value }))} />
                                </Form.Group>
                            </div>

                            <div className="col-md-12">
                                <div className="mb-0">
                                    <div className="form-check form-switch d-flex align-items-center justify-content-between mb-3 ps-0">
                                        <label className="form-check-label" htmlFor="switch-show-notes">Show Notes</label>
                                        <Form.Check type="switch" id="switch-show-notes" checked={form.showNotes ?? false} onChange={(e) => setForm((p) => ({ ...p, showNotes: e.target.checked }))} />
                                    </div>
                                    <div className="form-check form-switch d-flex align-items-center justify-content-between mb-0 ps-0">
                                        <label className="form-check-label" htmlFor="switch-print-tokens">Print Tokens</label>
                                        <Form.Check type="switch" id="switch-print-tokens" checked={form.printTokens ?? false} onChange={(e) => setForm((p) => ({ ...p, printTokens: e.target.checked }))} />
                                    </div>
                                </div>
                            </div>
                        </div>

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

export default PrintSettingsPage;
