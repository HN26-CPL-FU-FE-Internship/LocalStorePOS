import { useCallback, useEffect, useState } from 'react';
import { Card, Button, Modal, Form, Alert } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import {
    getTaxes,
    createTax,
    updateTax,
    deleteTax,
    updateTaxStatus,
    type TaxEntry,
    type TaxFormData,
    type TaxTypeValue,
    type TaxStatusValue,
} from '@/api/tax.api';

const emptyForm: TaxFormData = {
    title: '',
    taxRate: 0,
    taxType: 'exclusive',
    status: 'active',
};

const TaxSettingsPage = () => {
    const [taxes, setTaxes] = useState<TaxEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [currentTax, setCurrentTax] = useState<TaxEntry | null>(null);
    const [form, setForm] = useState<TaxFormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadTaxes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getTaxes();
            setTaxes(result);
        } catch {
            setError('Failed to load tax settings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTaxes();
    }, [loadTaxes]);

    useEffect(() => {
        if (!success) return;
        const t = setTimeout(() => setSuccess(null), 3000);
        return () => clearTimeout(t);
    }, [success]);

    const resetForm = () => setForm(emptyForm);

    const openAdd = () => {
        resetForm();
        setShowAdd(true);
    };

    const handleAdd = async () => {
        setSaving(true);
        setError(null);
        try {
            await createTax(form);
            setShowAdd(false);
            resetForm();
            setSuccess('Tax created successfully.');
            await loadTaxes();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create tax.');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (tax: TaxEntry) => {
        setCurrentTax(tax);
        setForm({
            title: tax.title,
            taxRate: tax.taxRate,
            taxType: tax.taxType as TaxTypeValue,
            status: tax.status as TaxStatusValue,
        });
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!currentTax) return;
        setSaving(true);
        setError(null);
        try {
            await updateTax(currentTax.id, form);
            setShowEdit(false);
            setCurrentTax(null);
            resetForm();
            setSuccess('Tax updated successfully.');
            await loadTaxes();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update tax.');
        } finally {
            setSaving(false);
        }
    };

    const openDelete = (tax: TaxEntry) => {
        setCurrentTax(tax);
        setShowDelete(true);
    };

    const handleDelete = async () => {
        if (!currentTax) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteTax(currentTax.id);
            setShowDelete(false);
            setCurrentTax(null);
            setSuccess('Tax deleted successfully.');
            await loadTaxes();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete tax.');
            setShowDelete(false);
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleStatus = async (tax: TaxEntry) => {
        const nextStatus: TaxStatusValue = tax.status === 'active' ? 'inactive' : 'active';
        try {
            await updateTaxStatus(tax.id, nextStatus);
            setTaxes((prev) => prev.map((t) => (t.id === tax.id ? { ...t, status: nextStatus } : t)));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update status.');
        }
    };

    const TaxFormContent = () => (
        <>
            <Form.Group className="mb-3">
                <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Tax Rate (%) <span className="text-danger">*</span></Form.Label>
                <Form.Control type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm((p) => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Tax Type <span className="text-danger">*</span></Form.Label>
                <Form.Select value={form.taxType} onChange={(e) => setForm((p) => ({ ...p, taxType: e.target.value as TaxTypeValue }))}>
                    <option value="exclusive">Exclusive</option>
                    <option value="inclusive">Inclusive</option>
                </Form.Select>
            </Form.Group>
        </>
    );

    return (
        <>
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-3 mb-4">
                <div className="flex-grow-1">
                    <h3 className="mb-0">
                        Tax Settings
                        <Button variant="white" size="sm" className="btn-icon rounded-circle ms-2" onClick={loadTaxes}>
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
                <div className="gap-2 d-flex align-items-center flex-wrap">
                    <Button variant="primary" className="d-inline-flex align-items-center" onClick={openAdd}>
                        <Icon name="circle-plus" className="me-1" /> Add New
                    </Button>
                </div>
            </div>

            {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            <Card className="mb-0">
                <Card.Body>
                    <div className="table-responsive table-nowrap">
                        <table className="table mb-0 border">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tax Name</th>
                                    <th>Rate</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4">Loading...</td>
                                    </tr>
                                )}
                                {!loading && taxes.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4 text-muted">No tax settings found.</td>
                                    </tr>
                                )}
                                {!loading && taxes.map((tax, index) => (
                                    <tr key={tax.id}>
                                        <td>{index + 1}</td>
                                        <td>{tax.title}</td>
                                        <td>{tax.taxRate}%</td>
                                        <td>
                                            <span className="badge bg-light text-dark">
                                                {tax.taxType === 'inclusive' ? 'Inclusive' : 'Exclusive'}
                                            </span>
                                        </td>
                                        <td>
                                            <Form.Check
                                                type="switch"
                                                id={`tax-status-${tax.id}`}
                                                checked={tax.status === 'active'}
                                                onChange={() => handleToggleStatus(tax)}
                                            />
                                        </td>
                                        <td>
                                            <Button variant="white" size="sm" className="btn-icon rounded-circle me-2" onClick={() => openEdit(tax)}>
                                                <Icon name="pencil-line" />
                                            </Button>
                                            <Button variant="white" size="sm" className="btn-icon rounded-circle text-danger" onClick={() => openDelete(tax)}>
                                                <Icon name="trash-2" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card.Body>
            </Card>

            {/* Add Modal */}
            <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Add Tax</h4>
                </Modal.Header>
                <Form onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
                    <Modal.Body className="p-4 pt-1">
                        <TaxFormContent />
                        <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                            <Button variant="light" className="w-100" onClick={() => setShowAdd(false)}>Cancel</Button>
                            <Button variant="primary" type="submit" className="w-100" disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* Edit Modal */}
            <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Edit Tax</h4>
                </Modal.Header>
                <Form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
                    <Modal.Body className="p-4 pt-1">
                        <TaxFormContent />
                        <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                            <Button variant="light" className="w-100" onClick={() => setShowEdit(false)}>Cancel</Button>
                            <Button variant="primary" type="submit" className="w-100" disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal show={showDelete} onHide={() => setShowDelete(false)} centered size="sm">
                <Modal.Body className="text-center p-4">
                    <div className="mb-4">
                        <span className="avatar avatar-xxl rounded-circle bg-danger-subtle d-inline-flex align-items-center justify-content-center">
                            <Icon name="trash-2" className="fs-2 text-danger" />
                        </span>
                    </div>
                    <h4 className="mb-1">Delete Confirmation</h4>
                    <p className="mb-4">Are you sure you want to delete{currentTax ? ` "${currentTax.title}"?` : '?'}</p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="light" className="w-100" onClick={() => setShowDelete(false)}>Close</Button>
                        <Button variant="danger" className="w-100" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default TaxSettingsPage;
