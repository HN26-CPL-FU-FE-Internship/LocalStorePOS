import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import { getAssetUrl } from '@/lib';
import { getStoreSetting, updateStoreSetting, type StoreSetting, type StoreSettingFormData } from '@/api/store.api';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';

const CURRENCIES = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'VND', label: 'VND - Vietnamese Dong' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'KRW', label: 'KRW - South Korean Won' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
    { value: 'THB', label: 'THB - Thai Baht' },
    { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
];

const StoreSettingsPage = () => {
    const { showToast } = useContextData(ToastContext);
    const [setting, setSetting] = useState<StoreSetting | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<StoreSettingFormData>({
        name: '',
        addressLine1: '',
        currencyCode: 'USD',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadSetting = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getStoreSetting();
            setSetting(result);
            setForm({
                name: result.name,
                addressLine1: result.addressLine1,
                addressLine2: result.addressLine2 || '',
                city: result.city || '',
                state: result.state || '',
                country: result.country || '',
                postalCode: result.postalCode || '',
                email: result.email || '',
                phone: result.phone || '',
                currencyCode: result.currencyCode,
                timezone: result.timezone,
                enableQrMenu: result.enableQrMenu ?? true,
                enableTakeaway: result.enableTakeaway ?? true,
                enableDineIn: result.enableDineIn ?? true,
                enableReservation: result.enableReservation ?? false,
                enableOrderViaQr: result.enableOrderViaQr ?? true,
                enableDelivery: result.enableDelivery ?? true,
                enableTable: result.enableTable ?? true,
            });
        } catch {
            showToast('error', 'Failed to load store settings. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSetting();
    }, [loadSetting]);


    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(file ? URL.createObjectURL(file) : null);
    };

    const clearImage = () => {
        handleImageChange(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await updateStoreSetting({ ...form, image: imageFile || undefined });
            setSetting(updated);
            showToast('success', 'Store settings updated successfully.');
        } catch (err: unknown) {
            showToast('error', err instanceof Error ? err.message : 'Failed to update store settings.');
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
                        Store Settings
                        <Button variant="white" size="sm" className="btn-icon rounded-circle ms-2" onClick={loadSetting}>
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
            </div>


            <Card className="mb-0">
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-xl-12">
                                <div className="mb-3 d-flex align-items-center flex-wrap gap-3">
                                    <div className="avatar avatar-3xl border bg-light d-flex align-items-center justify-content-center overflow-hidden">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="preview" className="img-fluid" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                        ) : setting && getAssetUrl(setting.imagePath) ? (
                                            <img src={getAssetUrl(setting.imagePath)} alt={setting.name} className="img-fluid" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                        ) : (
                                            <Icon name="images" className="fs-28 text-dark" />
                                        )}
                                    </div>
                                    <div>
                                        <Form.Label className="mb-1">Upload Store Image</Form.Label>
                                        <p className="fs-13 mb-3">Image should be within 5 MB</p>
                                        <div className="d-flex align-items-center">
                                            <div className="btn btn-icon btn-sm btn-white rounded-circle position-relative me-2">
                                                <Form.Control
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="position-absolute w-100 h-100 top-0 start-0 opacity-0"
                                                    onChange={(e) => {
                                                        const target = e.target as HTMLInputElement;
                                                        handleImageChange(target.files?.[0] ?? null);
                                                    }}
                                                />
                                                <Icon name="upload" />
                                            </div>
                                            <Button variant="white" size="sm" className="btn-icon rounded-circle text-danger" onClick={clearImage}>
                                                <Icon name="trash-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-12">
                                <Form.Group className="mb-3">
                                    <Form.Label>Store Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                                </Form.Group>
                            </div>

                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Address 1 <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="text" value={form.addressLine1} onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))} required />
                                </Form.Group>
                            </div>

                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Address 2</Form.Label>
                                    <Form.Control type="text" value={form.addressLine2 || ''} onChange={(e) => setForm((p) => ({ ...p, addressLine2: e.target.value }))} />
                                </Form.Group>
                            </div>

                            <div className="col-md-3">
                                <Form.Group className="mb-3">
                                    <Form.Label>Country</Form.Label>
                                    <Form.Control type="text" value={form.country || ''} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
                                </Form.Group>
                            </div>

                            <div className="col-md-3">
                                <Form.Group className="mb-3">
                                    <Form.Label>State</Form.Label>
                                    <Form.Control type="text" value={form.state || ''} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
                                </Form.Group>
                            </div>

                            <div className="col-md-3">
                                <Form.Group className="mb-3">
                                    <Form.Label>City</Form.Label>
                                    <Form.Control type="text" value={form.city || ''} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
                                </Form.Group>
                            </div>

                            <div className="col-md-3">
                                <Form.Group className="mb-3">
                                    <Form.Label>Postal Code</Form.Label>
                                    <Form.Control type="text" value={form.postalCode || ''} onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))} />
                                </Form.Group>
                            </div>

                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="email" value={form.email || ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                                </Form.Group>
                            </div>

                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Phone <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="tel" value={form.phone || ''} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                                </Form.Group>
                            </div>

                            <div className="col-md-12">
                                <Form.Group className="mb-3">
                                    <Form.Label>Currency <span className="text-danger">*</span></Form.Label>
                                    <Form.Select value={form.currencyCode} onChange={(e) => setForm((p) => ({ ...p, currencyCode: e.target.value }))}>
                                        {CURRENCIES.map((c) => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </div>

                            <div className="col-md-6">
                                <div className="mb-3">
                                    <Form.Check type="switch" id="switch-enable-qr" label="Enable QR Menu" checked={form.enableQrMenu ?? false} onChange={(e) => setForm((p) => ({ ...p, enableQrMenu: e.target.checked }))} />
                                    <Form.Check type="switch" id="switch-enable-takeaway" label="Enable Take Away" checked={form.enableTakeaway ?? false} onChange={(e) => setForm((p) => ({ ...p, enableTakeaway: e.target.checked }))} />
                                    <Form.Check type="switch" id="switch-enable-dinein" label="Enable Dine In" checked={form.enableDineIn ?? false} onChange={(e) => setForm((p) => ({ ...p, enableDineIn: e.target.checked }))} />
                                    <Form.Check type="switch" id="switch-enable-reservation" label="Enable Reservation" checked={form.enableReservation ?? false} onChange={(e) => setForm((p) => ({ ...p, enableReservation: e.target.checked }))} />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="mb-3">
                                    <Form.Check type="switch" id="switch-enable-order-via-qr" label="Enable Order Via QR Menu" checked={form.enableOrderViaQr ?? false} onChange={(e) => setForm((p) => ({ ...p, enableOrderViaQr: e.target.checked }))} />
                                    <Form.Check type="switch" id="switch-enable-delivery" label="Enable Delivery" checked={form.enableDelivery ?? false} onChange={(e) => setForm((p) => ({ ...p, enableDelivery: e.target.checked }))} />
                                    <Form.Check type="switch" id="switch-enable-table" label="Enable Table" checked={form.enableTable ?? false} onChange={(e) => setForm((p) => ({ ...p, enableTable: e.target.checked }))} />
                                </div>
                            </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-end flex-wrap row-gap-2 border-top mt-2 pt-4">
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

export default StoreSettingsPage;
