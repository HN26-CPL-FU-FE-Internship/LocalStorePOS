import { useEffect, useMemo, useState } from 'react';
import { Table, Card, Badge, Button, Dropdown, Modal, Form, Offcanvas, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { isAxiosError } from 'axios';
import Icon from '@/components/common/Icon';
import ApprovalRequestModal from '@/components/common/ApprovalRequestModal';
import {
    createCoupon,
    getCoupons,
    updateCoupon,
    updateCouponStatus,
    type CouponEntry,
    type CouponStatus,
    type DiscountType,
} from '@/api/coupon.api';
import { getCategoryOptions } from '@/api/item.api';
import type { Option } from '@/api/item.api';

/* ------------------------------------------------------------------ */
/*  Static labels                                                     */
/* ------------------------------------------------------------------ */
const discountTypeLabels: Record<DiscountType, string> = {
    percentage: 'Percentage',
    fixed_amount: 'Fixed Amount',
};

const statusBadgeClass: Record<CouponStatus, string> = {
    active: 'badge-soft-success',
    inactive: 'badge-soft-secondary',
    expired: 'badge-soft-danger',
};

type SortOption = 'newest' | 'oldest' | 'asc' | 'desc';

const sortLabels: Record<SortOption, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    asc: 'Ascending',
    desc: 'Descending',
};

const emptyForm = {
    code: '',
    categoryIds: [] as number[],
    discountType: 'percentage' as DiscountType,
    discountAmount: '',
    startDate: '',
    expiryDate: '',
    status: 'active' as CouponStatus,
};

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

const formatDiscount = (type: DiscountType, amount: number) =>
    type === 'percentage' ? `${amount}%` : `$${Number(amount).toFixed(2)}`;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
const CouponsPage = () => {
    /* ---------- data state ---------- */
    const [coupons, setCoupons] = useState<CouponEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);

    /* ---------- query state ---------- */
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<CouponStatus | ''>('');
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    /* ---------- modal state ---------- */
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDeleteApproval, setShowDeleteApproval] = useState(false);
    const [showShow, setShowShow] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [currentCoupon, setCurrentCoupon] = useState<CouponEntry | null>(null);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    /* ---------- form state ---------- */
    const [form, setForm] = useState(emptyForm);

    /* ---------- filter draft (offcanvas) ---------- */
    const [draftStatus, setDraftStatus] = useState<CouponStatus | ''>('');

    /* ---------- helpers ---------- */
    const resetForm = () => setForm(emptyForm);

    const sortParams = useMemo(() => {
        switch (sortOption) {
            case 'oldest':
                return { sortBy: 'createdAt', sortDir: 'asc' };
            case 'asc':
                return { sortBy: 'code', sortDir: 'asc' };
            case 'desc':
                return { sortBy: 'code', sortDir: 'desc' };
            case 'newest':
            default:
                return { sortBy: 'createdAt', sortDir: 'desc' };
        }
    }, [sortOption]);

    /* ---------- initial option load ---------- */
    useEffect(() => {
        (async () => {
            try {
                setCategoryOptions(await getCategoryOptions());
            } catch {
                // Non-fatal: category select will simply be empty until retried.
            }
        })();
    }, []);

    /* ---------- data loading ---------- */
    const loadCoupons = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCoupons({
                page,
                size,
                sortBy: sortParams.sortBy,
                sortDir: sortParams.sortDir,
                search: search || undefined,
                status: statusFilter || undefined,
            });
            setCoupons(result.items);
            setTotalPages(result.totalPages || 1);
            setTotalElements(result.totalElements);
        } catch {
            setError('Unable to load coupons. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadCoupons();
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

    const buildPayload = () => ({
        code: form.code.trim().toUpperCase(),
        categoryIds: form.categoryIds,
        discountType: form.discountType,
        discountAmount: Number(form.discountAmount),
        startDate: form.startDate,
        expiryDate: form.expiryDate,
        status: form.status,
    });

    /* ---------- CRUD actions ---------- */
    const openAdd = () => {
        resetForm();
        setShowAdd(true);
    };

    const handleAdd = async () => {
        setSaving(true);
        setError(null);
        try {
            await createCoupon(buildPayload());
            setShowAdd(false);
            resetForm();
            setNotice('Coupon created successfully.');
            setPage(1);
            await loadCoupons();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to create coupon.'));
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (coupon: CouponEntry) => {
        setCurrentCoupon(coupon);
        setForm({
            code: coupon.code,
            categoryIds: coupon.categoryIds,
            discountType: coupon.discountType,
            discountAmount: String(coupon.discountAmount),
            startDate: coupon.startDate,
            expiryDate: coupon.expiryDate,
            status: coupon.status === 'expired' ? 'active' : coupon.status,
        });
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!currentCoupon) return;
        setSaving(true);
        setError(null);
        try {
            await updateCoupon(currentCoupon.id, buildPayload());
            setShowEdit(false);
            setCurrentCoupon(null);
            resetForm();
            setNotice('Coupon updated successfully.');
            await loadCoupons();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to update coupon.'));
        } finally {
            setSaving(false);
        }
    };

    const openShow = (coupon: CouponEntry) => {
        setCurrentCoupon(coupon);
        setCopied(false);
        setShowShow(true);
    };

    const handleCopy = async () => {
        if (!currentCoupon) return;
        try {
            await navigator.clipboard.writeText(currentCoupon.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API unavailable — silently ignore.
        }
    };

    const openDelete = (coupon: CouponEntry) => {
        setCurrentCoupon(coupon);
        setShowDeleteApproval(true);
    };


    const handleToggleStatus = async (coupon: CouponEntry) => {
        const nextStatus: CouponStatus = coupon.status === 'active' ? 'inactive' : 'active';
        try {
            await updateCouponStatus(coupon.id, nextStatus);
            setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, status: nextStatus } : c)));
        } catch (err) {
            setError(extractErrorMessage(err, 'Unable to update status.'));
        }
    };

    /* ---------- filter offcanvas ---------- */
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

    const toggleCategoryId = (id: number) =>
        setForm((p) => ({
            ...p,
            categoryIds: p.categoryIds.includes(id)
                ? p.categoryIds.filter((c) => c !== id)
                : [...p.categoryIds, id],
        }));

    /* ---------- render ---------- */
    return (
        <>
            {/* ---- Page Header ---- */}
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-3 mb-4">
                <div className="flex-grow-1">
                    <h3 className="mb-0">
                        Coupons
                        <Button
                            variant="white"
                            size="sm"
                            className="btn-icon rounded-circle ms-2"
                            aria-label="refresh"
                            onClick={() => loadCoupons()}
                        >
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
                <div className="gap-2 d-flex align-items-center flex-wrap">
                    <Dropdown>
                        <Dropdown.Toggle as={Button} variant="white" className="d-inline-flex align-items-center">
                            <Icon name="upload" className="me-1" />
                            Export
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end" className="p-3">
                            <Dropdown.Item className="rounded" href="#">
                                Export as PDF
                            </Dropdown.Item>
                            <Dropdown.Item className="rounded" href="#">
                                Export as Excel
                            </Dropdown.Item>
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

            {/* ---- Card with table ---- */}
            <Card className="mb-0">
                <Card.Body>
                    {/* Toolbar */}
                    <div className="d-flex align-items-center flex-wrap gap-3 justify-content-between mb-4">
                        <div className="search-input">
                            <div className="datatable-search position-relative">
                                <input
                                    className="form-control form-control-sm"
                                    placeholder="Search coupon code"
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                <Icon
                                    name="search"
                                    className="position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
                                />
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
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
                                    Sort by : {sortLabels[sortOption]}
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
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-responsive table-nowrap">
                        <Table className="mb-0 border">
                            <thead>
                                <tr>
                                    <th>Coupon Code</th>
                                    <th>Valid Category</th>
                                    <th>Discount Type</th>
                                    <th>Discount Amount</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4">
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Loading...
                                        </td>
                                    </tr>
                                )}

                                {!loading && coupons.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-muted">
                                            No coupons found.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    coupons.map((coupon) => (
                                        <tr key={coupon.id}>
                                            <td>
                                                <a
                                                    href="#!"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        openShow(coupon);
                                                    }}
                                                >
                                                    {coupon.code}
                                                </a>
                                            </td>
                                            <td>{coupon.categoryNames.join(', ') || '-'}</td>
                                            <td>{discountTypeLabels[coupon.discountType]}</td>
                                            <td>{formatDiscount(coupon.discountType, coupon.discountAmount)}</td>
                                            <td>
                                                {formatDate(coupon.startDate)} - {formatDate(coupon.expiryDate)}
                                            </td>
                                            <td>
                                                <Badge
                                                    bg=""
                                                    role={coupon.status !== 'expired' ? 'button' : undefined}
                                                    className={statusBadgeClass[coupon.status]}
                                                    onClick={() =>
                                                        coupon.status !== 'expired' && handleToggleStatus(coupon)
                                                    }
                                                    title={coupon.status !== 'expired' ? 'Click to toggle status' : undefined}
                                                >
                                                    {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button
                                                    variant="white"
                                                    size="sm"
                                                    className="btn-icon rounded-circle me-2"
                                                    onClick={() => openShow(coupon)}
                                                    title="View"
                                                >
                                                    <Icon name="eye" />
                                                </Button>
                                                <Button
                                                    variant="white"
                                                    size="sm"
                                                    className="btn-icon rounded-circle me-2"
                                                    onClick={() => openEdit(coupon)}
                                                    title="Edit"
                                                >
                                                    <Icon name="pencil-line" />
                                                </Button>
                                                <Button
                                                    variant="white"
                                                    size="sm"
                                                    className="btn-icon rounded-circle"
                                                    onClick={() => openDelete(coupon)}
                                                    title="Delete"
                                                >
                                                    <Icon name="trash-2" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3">
                        <p className="mb-0 text-muted fs-13">
                            Showing {coupons.length === 0 ? 0 : (page - 1) * size + 1}-
                            {(page - 1) * size + coupons.length} of {totalElements} coupons
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
                </Card.Body>
            </Card>

            {/* ================================================================ */}
            {/*  ADD / EDIT MODAL                                                 */}
            {/* ================================================================ */}
            {[
                { show: showAdd, setShow: setShowAdd, title: 'Add Coupon', onSubmit: handleAdd },
                { show: showEdit, setShow: setShowEdit, title: 'Edit Coupon', onSubmit: handleEdit },
            ].map(({ show, setShow, title, onSubmit }) => (
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
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Coupon Code<span className="text-danger"> *</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={form.code}
                                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Valid Category<span className="text-danger"> *</span>
                                </Form.Label>
                                <div className="border rounded p-2" style={{ maxHeight: 140, overflowY: 'auto' }}>
                                    {categoryOptions.length === 0 && (
                                        <p className="text-muted fs-13 mb-0">No categories available.</p>
                                    )}
                                    {categoryOptions.map((c) => (
                                        <Form.Check
                                            key={c.id}
                                            type="checkbox"
                                            id={`coupon-category-${title}-${c.id}`}
                                            label={c.name}
                                            checked={form.categoryIds.includes(c.id)}
                                            onChange={() => toggleCategoryId(c.id)}
                                        />
                                    ))}
                                </div>
                            </Form.Group>

                            <Row>
                                <Col lg={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Discount Type<span className="text-danger"> *</span>
                                        </Form.Label>
                                        <Form.Select
                                            value={form.discountType}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    discountType: e.target.value as DiscountType,
                                                }))
                                            }
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="fixed_amount">Fixed Amount</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col lg={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Discount Amount<span className="text-danger"> *</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={form.discountAmount}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, discountAmount: e.target.value }))
                                            }
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col lg={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Start Date<span className="text-danger"> *</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={form.startDate}
                                            onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col lg={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Expiry Date<span className="text-danger"> *</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={form.expiryDate}
                                            onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    value={form.status}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, status: e.target.value as CouponStatus }))
                                    }
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </Form.Select>
                            </Form.Group>

                            <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                                <Button variant="light" className="w-100" onClick={() => setShow(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100"
                                    disabled={saving || form.categoryIds.length === 0}
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </Modal.Body>
                    </Form>
                </Modal>
            ))}

            {/* ---- Show Coupon Modal ---- */}
            <Modal show={showShow} onHide={() => setShowShow(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Coupon Code</h4>
                </Modal.Header>
                <Modal.Body className="p-4 pt-1">
                    <div className="p-4 bg-light border rounded border-dashed d-flex align-items-center justify-content-between mb-3">
                        <h6 className="mb-0">{currentCoupon?.code}</h6>
                        <Button variant="link" className="p-0 border-0" onClick={handleCopy} title="Copy to Clipboard">
                            <Icon name={copied ? 'check' : 'copy'} className={copied ? 'text-success' : ''} />
                        </Button>
                    </div>
                    <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                        <Button variant="light" className="w-100" onClick={() => setShowShow(false)}>
                            Close
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>


            {/* ---- Delete Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showDeleteApproval}
                onHide={() => setShowDeleteApproval(false)}
                actionLabel="delete"
                requestType="DELETE_IMPORTANT_DATA"
                description={`Delete coupon ${currentCoupon?.code ?? ''}`}
                targetType="COUPON"
                targetId={currentCoupon?.id}
                targetDisplay={currentCoupon?.code}
                additionalData={
                    currentCoupon ? JSON.stringify({ targetType: 'COUPON', targetId: currentCoupon.id }) : null
                }
                onSent={() => {
                    setShowDeleteApproval(false);
                    setCurrentCoupon(null);
                    setNotice('Delete coupon request sent.');
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
                                onChange={(e) => setDraftStatus(e.target.value as CouponStatus | '')}
                            >
                                <option value="">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="expired">Expired</option>
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

export default CouponsPage;
