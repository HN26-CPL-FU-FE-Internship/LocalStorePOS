import { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, Card, Button, Dropdown, Modal, Form, Offcanvas, Alert, Spinner, Badge } from 'react-bootstrap';
import { isAxiosError } from 'axios';
import Icon from '@/components/common/Icon';
import ApprovalRequestModal from '@/components/common/ApprovalRequestModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import useAuth from '@/hooks/useAuth';
import { getAssetUrl } from '@/lib';
import {
    createCustomer,
    deleteCustomer,
    getCustomers,
    updateCustomer,
    type CustomerEntry,
    type CustomerStatus,
    type Gender,
} from '@/api/customer.api';

type SortOption = 'newest' | 'oldest' | 'nameAsc' | 'nameDesc';

const sortLabels: Record<SortOption, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    nameAsc: 'Name: A to Z',
    nameDesc: 'Name: Z to A',
};

const emptyForm = {
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '' as Gender | '',
    status: 'active' as CustomerStatus,
};

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

const genderLabel = (g: Gender | null) => (g ? g.charAt(0).toUpperCase() + g.slice(1) : '-');

const CustomersPage = () => {
    /* ---------- data state ---------- */
    const [customers, setCustomers] = useState<CustomerEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    /* ---------- query state ---------- */
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [page, setPage] = useState(1);
    const [size] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    /* ---------- modal state ---------- */
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDeleteApproval, setShowDeleteApproval] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<CustomerEntry | null>(null);
    const [saving, setSaving] = useState(false);

    /* ---------- form state ---------- */
    const [form, setForm] = useState(emptyForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [draftStatus, setDraftStatus] = useState<CustomerStatus | ''>('');

    const resetForm = () => {
        setForm(emptyForm);
        setImageFile(null);
        setImagePreview(null);
    };

    const sortParams = useMemo(() => {
        switch (sortOption) {
            case 'oldest':
                return { sortBy: 'createdAt', sortDir: 'asc' };
            case 'nameAsc':
                return { sortBy: 'name', sortDir: 'asc' };
            case 'nameDesc':
                return { sortBy: 'name', sortDir: 'desc' };
            case 'newest':
            default:
                return { sortBy: 'createdAt', sortDir: 'desc' };
        }
    }, [sortOption]);

    const loadCustomers = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCustomers({
                page,
                size,
                sortBy: sortParams.sortBy,
                sortDir: sortParams.sortDir,
                search: search || undefined,
                status: statusFilter || undefined,
            });
            setCustomers(result.items);
            setTotalPages(result.totalPages || 1);
            setTotalElements(result.totalElements);
        } catch {
            setError('Failed to load customers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, size, sortParams, search, statusFilter]);

    useEffect(() => {
        const handle = setTimeout(() => {
            setPage(1);
            setSearch(searchInput.trim());
        }, 400);
        return () => clearTimeout(handle);
    }, [searchInput]);

    useEffect(() => {
        if (!notice) return;
        const handle = setTimeout(() => setNotice(null), 3000);
        return () => clearTimeout(handle);
    }, [notice]);

    const extractErrorMessage = (err: unknown, fallback: string) => {
        if (isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
            const data = err.response.data as { message?: string };
            if (data.message) return data.message;
        }
        return fallback;
    };

    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(file ? URL.createObjectURL(file) : null);
    };

    const clearImage = () => {
        handleImageChange(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const buildPayload = () => ({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        status: form.status,
        image: imageFile,
    });

    const openAdd = () => {
        resetForm();
        setShowAdd(true);
    };

    const handleAdd = async () => {
        setSaving(true);
        setError(null);
        try {
            await createCustomer(buildPayload());
            setShowAdd(false);
            resetForm();
            setNotice('Customer added successfully.');
            setPage(1);
            await loadCustomers();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to add customer.'));
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (customer: CustomerEntry) => {
        setCurrentCustomer(customer);
        setForm({
            name: customer.name,
            phone: customer.phone,
            email: customer.email ?? '',
            dateOfBirth: customer.dateOfBirth ?? '',
            gender: customer.gender ?? '',
            status: customer.status,
        });
        setImageFile(null);
        setImagePreview(null);
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!currentCustomer) return;
        setSaving(true);
        setError(null);
        try {
            await updateCustomer(currentCustomer.id, buildPayload());
            setShowEdit(false);
            setCurrentCustomer(null);
            resetForm();
            setNotice('Customer updated successfully.');
            await loadCustomers();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to update customer.'));
        } finally {
            setSaving(false);
        }
    };

    const { isAdmin } = useAuth();

    const openDelete = (customer: CustomerEntry) => {
        setCurrentCustomer(customer);
        if (isAdmin) {
            setShowDeleteConfirm(true);
        } else {
            setShowDeleteApproval(true);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!currentCustomer) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteCustomer(currentCustomer.id);
            setShowDeleteConfirm(false);
            setCurrentCustomer(null);
            setNotice('Customer deleted successfully.');
            await loadCustomers();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to delete customer.'));
        } finally {
            setDeleting(false);
        }
    };


    const openFilter = () => {
        setDraftStatus(statusFilter);
        setShowFilter(true);
    };

    const applyFilter = () => {
        setStatusFilter(draftStatus);
        setPage(1);
        setShowFilter(false);
    };

    const resetFilter = () => {
        setDraftStatus('');
        setStatusFilter('');
        setPage(1);
        setShowFilter(false);
    };

    return (
        <>
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-3 mb-4">
                <div className="flex-grow-1">
                    <h3 className="mb-0">
                        Customers
                        <Button
                            variant="white"
                            size="sm"
                            className="btn-icon rounded-circle ms-2"
                            aria-label="refresh"
                            onClick={() => loadCustomers()}
                        >
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
                <div className="gap-2 d-flex align-items-center flex-wrap">
                    <div className="input-group input-group-flat w-auto">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <span className="input-group-text">
                            <Icon name="search" className="text-dark" />
                        </span>
                    </div>
                    <Button variant="white" className="d-inline-flex align-items-center" onClick={openFilter}>
                        <Icon name="funnel" className="me-2" />
                        Filter
                        {statusFilter && (
                            <Badge bg="primary" className="ms-2">
                                1
                            </Badge>
                        )}
                    </Button>
                    <Dropdown>
                        <Dropdown.Toggle as={Button} variant="white" className="d-inline-flex align-items-center">
                            Sort by: {sortLabels[sortOption]}
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end" className="p-3">
                            {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                                <Dropdown.Item
                                    key={opt}
                                    active={opt === sortOption}
                                    onClick={() => {
                                        setSortOption(opt);
                                        setPage(1);
                                    }}
                                >
                                    {sortLabels[opt]}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                    <Button variant="primary" className="d-inline-flex align-items-center" onClick={openAdd}>
                        <Icon name="circle-plus" className="me-1" />
                        Add New
                    </Button>
                </div>
            </div>

            {notice && (
                <Alert variant="success" onClose={() => setNotice(null)} dismissible>
                    {notice}
                </Alert>
            )}
            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" className="me-2" />
                    Loading...
                </div>
            )}

            {!loading && customers.length === 0 && (
                <div className="text-center py-5 text-muted">No customers found.</div>
            )}

            {!loading && customers.length > 0 && (
                <Row>
                    {customers.map((customer) => {
                        const avatarUrl = getAssetUrl(customer.avatarPath);
                        return (
                            <Col xxl={4} xl={4} md={6} sm={6} key={customer.id}>
                                <Card>
                                    <Card.Body>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div className="d-flex align-items-center">
                                                <span className="avatar avatar-rounded flex-shrink-0 me-2 bg-light d-flex align-items-center justify-content-center overflow-hidden">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt={customer.name} className="img-fluid" />
                                                    ) : (
                                                        <Icon name="user" className="text-secondary" />
                                                    )}
                                                </span>
                                                <span>
                                                    <h6 className="fs-14 fw-semibold mb-0">{customer.name}</h6>
                                                    <p className="mb-0">
                                                        {genderLabel(customer.gender)}
                                                        {customer.isWalkin ? ' • Walk-in' : ''}
                                                    </p>
                                                </span>
                                            </div>
                                            <p className="badge bg-light text-dark fw-medium fs-13 mb-0">
                                                #CR{customer.id.toString().padStart(4, '0')}
                                            </p>
                                        </div>
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <span className="d-flex align-items-center">
                                                    <Icon name="phone" className="text-dark me-2" /> Phone Number
                                                </span>
                                                <span className="fw-medium text-dark">{customer.phone}</span>
                                            </div>
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <span className="d-flex align-items-center">
                                                    <Icon name="mail" className="text-dark me-2" /> Email
                                                </span>
                                                <span className="fw-medium text-dark">{customer.email ?? '-'}</span>
                                            </div>
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <span className="d-flex align-items-center">
                                                    <Icon name="calendar-fold" className="text-dark me-2" /> Created at
                                                </span>
                                                <span className="fw-medium text-dark">{formatDate(customer.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between border-top pt-3">
                                            <span
                                                className={
                                                    'badge ' +
                                                    (customer.status === 'active'
                                                        ? 'badge-soft-success'
                                                        : 'badge-soft-danger')
                                                }
                                            >
                                                {customer.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                            <div className="d-flex">
                                                <Button
                                                    variant="white"
                                                    size="sm"
                                                    className="btn-icon rounded-circle me-2"
                                                    onClick={() => openEdit(customer)}
                                                >
                                                    <Icon name="pencil-line" />
                                                </Button>
                                                <Button
                                                    variant="white"
                                                    size="sm"
                                                    className="btn-icon rounded-circle"
                                                    onClick={() => openDelete(customer)}
                                                >
                                                    <Icon name="trash-2" className="text-danger" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {!loading && customers.length > 0 && (
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2">
                    <p className="mb-0 text-muted fs-13">
                        Showing {(page - 1) * size + 1}-{(page - 1) * size + customers.length} of {totalElements} customers
                    </p>
                    <div className="d-flex align-items-center gap-2">
                        <Button
                            variant="white"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Previous
                        </Button>
                        <span className="fs-13">
                            Page {page} / {totalPages}
                        </span>
                        <Button
                            variant="white"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* ---- Add / Edit Modal ---- */}
            {[
                { show: showAdd, setShow: setShowAdd, title: 'Add Customer', onSubmit: handleAdd, isEdit: false },
                { show: showEdit, setShow: setShowEdit, title: 'Edit Customer', onSubmit: handleEdit, isEdit: true },
            ].map(({ show, setShow, title, onSubmit, isEdit }) => (
                <Modal key={title} show={show} onHide={() => setShow(false)} centered>
                    <Modal.Header closeButton className="border-0 p-4 pb-3">
                        <h4 className="modal-title">{title}</h4>
                    </Modal.Header>
                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                    >
                        <Modal.Body className="p-4 pt-1">
                            <div className="mb-3 d-flex align-items-center flex-wrap gap-3">
                                <div className="avatar avatar-3xl border bg-light d-flex align-items-center justify-content-center overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="preview" className="img-fluid" />
                                    ) : isEdit && currentCustomer && getAssetUrl(currentCustomer.avatarPath) ? (
                                        <img
                                            src={getAssetUrl(currentCustomer.avatarPath)}
                                            alt={currentCustomer.name}
                                            className="img-fluid"
                                        />
                                    ) : (
                                        <Icon name="images" className="fs-28 text-dark" />
                                    )}
                                </div>
                                <div>
                                    <Form.Label>Customer Image</Form.Label>
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
                                            <Icon name={isEdit ? 'pencil-line' : 'upload'} />
                                        </div>
                                        <Button
                                            variant="white"
                                            size="sm"
                                            className="btn-icon rounded-circle text-danger"
                                            onClick={clearImage}
                                        >
                                            <Icon name="trash-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Customer Name<span className="text-danger"> *</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Phone<span className="text-danger"> *</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                />
                            </Form.Group>

                            <div className="row">
                                <div className="col-lg-6">
                                    <Form.Group className="mb-3">
                                        <Form.Label>Date of Birth</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={form.dateOfBirth}
                                            onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-lg-6">
                                    <Form.Group className="mb-3">
                                        <Form.Label>Gender</Form.Label>
                                        <Form.Select
                                            value={form.gender}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, gender: e.target.value as Gender | '' }))
                                            }
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </Form.Select>
                                    </Form.Group>
                                </div>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    value={form.status}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, status: e.target.value as CustomerStatus }))
                                    }
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Disabled</option>
                                </Form.Select>
                            </Form.Group>

                            <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                                <Button variant="light" className="w-100" onClick={() => setShow(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit" className="w-100" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </Modal.Body>
                    </Form>
                </Modal>
            ))}


            {/* ---- Delete Confirmation (admins delete directly) ---- */}
            <ConfirmModal
                show={showDeleteConfirm}
                handleClose={() => setShowDeleteConfirm(false)}
                type="delete"
                action={handleDeleteConfirm}
                data={currentCustomer?.name ?? ''}
                actionDisabled={deleting}
            />

            {/* ---- Delete Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showDeleteApproval}
                onHide={() => setShowDeleteApproval(false)}
                actionLabel="delete"
                requestType="DELETE_IMPORTANT_DATA"
                description={`Delete customer ${currentCustomer?.name ?? ''}`}
                targetType="CUSTOMER"
                targetId={currentCustomer?.id}
                targetDisplay={currentCustomer?.name}
                additionalData={
                    currentCustomer
                        ? JSON.stringify({ targetType: 'CUSTOMER', targetId: currentCustomer.id })
                        : null
                }
                onSent={() => {
                    setShowDeleteApproval(false);
                    setCurrentCustomer(null);
                    setNotice('Delete customer request sent.');
                }}
            />

            {/* ---- Filter Offcanvas ---- */}
            <Offcanvas show={showFilter} onHide={() => setShowFilter(false)} placement="end">
                <Offcanvas.Header className="pb-0">
                    <div className="border-bottom d-flex align-items-center justify-content-between w-100 pb-3">
                        <h4 className="offcanvas-title mb-0">Filter</h4>
                        <Button
                            variant="link"
                            className="btn-close-modal p-0 border-0"
                            onClick={() => setShowFilter(false)}
                            aria-label="Close"
                        >
                            <Icon name="x" />
                        </Button>
                    </div>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column pt-3">
                    <div>
                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                value={draftStatus}
                                onChange={(e) => setDraftStatus(e.target.value as CustomerStatus | '')}
                            >
                                <option value="">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Form.Group>
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-auto border-0 pt-3">
                        <Button variant="light" className="w-100" onClick={resetFilter}>
                            Reset
                        </Button>
                        <Button variant="primary" className="w-100" onClick={applyFilter}>
                            Apply
                        </Button>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default CustomersPage;
