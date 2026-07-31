import { useEffect, useMemo, useRef, useState } from 'react';
import { Table, Card, Badge, Button, Dropdown, Modal, Form, Offcanvas, Alert, Spinner } from 'react-bootstrap';
import { isAxiosError } from 'axios';
import Icon from '@/components/common/Icon';
import ApprovalRequestModal from '@/components/common/ApprovalRequestModal';
import {
    createAddon,
    getAddonImageUrl,
    getAddons,
    getItemOptions,
    updateAddon,
    updateAddonStatus,
    type AddonEntry,
    type AddonStatus,
} from '@/api/addon.api';
import type { Option } from '@/api/item.api';

/* ------------------------------------------------------------------ */
/*  Columns visibility helper                                         */
/* ------------------------------------------------------------------ */
interface ColumnOption {
    key: string;
    label: string;
    visible: boolean;
}

const defaultColumns: ColumnOption[] = [
    { key: 'item', label: 'Item', visible: true },
    { key: 'addon', label: 'Addon', visible: true },
    { key: 'price', label: 'Price', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'actions', label: 'Actions', visible: true },
];

type SortOption = 'newest' | 'oldest' | 'asc' | 'desc';

const sortLabels: Record<SortOption, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    asc: 'Ascending',
    desc: 'Descending',
};

const emptyForm = { itemId: '', name: '', price: '', description: '', status: 'active' as AddonStatus };
const formatCurrency = (value: number) => `$${Number(value).toFixed(2)}`;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
const AddonsPage = () => {
    /* ---------- data state ---------- */
    const [addons, setAddons] = useState<AddonEntry[]>([]);
    const [columns, setColumns] = useState<ColumnOption[]>(defaultColumns);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [itemOptions, setItemOptions] = useState<Option[]>([]);

    /* ---------- query state ---------- */
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [itemFilter, setItemFilter] = useState<number | ''>('');
    const [statusFilter, setStatusFilter] = useState<AddonStatus | ''>('');
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    /* ---------- modal state ---------- */
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDeleteApproval, setShowDeleteApproval] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [currentAddon, setCurrentAddon] = useState<AddonEntry | null>(null);
    const [saving, setSaving] = useState(false);

    /* ---------- form state ---------- */
    const [form, setForm] = useState(emptyForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ---------- filter draft (offcanvas) ---------- */
    const [draftItem, setDraftItem] = useState<number | ''>('');
    const [draftStatus, setDraftStatus] = useState<AddonStatus | ''>('');

    /* ---------- helpers ---------- */
    const toggleColumn = (key: string) =>
        setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
    const isColumnVisible = (key: string) => columns.find((c) => c.key === key)?.visible;

    const resetForm = () => {
        setForm(emptyForm);
        setImageFile(null);
        setImagePreview(null);
    };

    const sortParams = useMemo(() => {
        switch (sortOption) {
            case 'oldest':
                return { sortBy: 'createdAt', sortDir: 'asc' };
            case 'asc':
                return { sortBy: 'name', sortDir: 'asc' };
            case 'desc':
                return { sortBy: 'name', sortDir: 'desc' };
            case 'newest':
            default:
                return { sortBy: 'createdAt', sortDir: 'desc' };
        }
    }, [sortOption]);

    /* ---------- initial option load ---------- */
    useEffect(() => {
        (async () => {
            try {
                setItemOptions(await getItemOptions());
            } catch {
                // Non-fatal: item select will simply be empty until retried.
            }
        })();
    }, []);

    /* ---------- data loading ---------- */
    const loadAddons = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAddons({
                page,
                size,
                sortBy: sortParams.sortBy,
                sortDir: sortParams.sortDir,
                search: search || undefined,
                itemId: itemFilter || undefined,
                status: statusFilter || undefined,
            });
            setAddons(result.items);
            setTotalPages(result.totalPages || 1);
            setTotalElements(result.totalElements);
        } catch {
            setError('Không thể tải danh sách addon. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAddons();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, size, sortParams, search, itemFilter, statusFilter]);

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

    /* ---------- image handling ---------- */
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
        itemId: Number(form.itemId),
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        status: form.status,
        image: imageFile,
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
            await createAddon(buildPayload());
            setShowAdd(false);
            resetForm();
            setNotice('Thêm addon thành công.');
            setPage(1);
            await loadAddons();
        } catch (err) {
            setError(extractErrorMessage(err, 'Thêm addon thất bại.'));
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (addon: AddonEntry) => {
        setCurrentAddon(addon);
        setForm({
            itemId: String(addon.itemId),
            name: addon.name,
            price: String(addon.price),
            description: addon.description,
            status: addon.status,
        });
        setImageFile(null);
        setImagePreview(null);
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!currentAddon) return;
        setSaving(true);
        setError(null);
        try {
            await updateAddon(currentAddon.id, buildPayload());
            setShowEdit(false);
            setCurrentAddon(null);
            resetForm();
            setNotice('Cập nhật addon thành công.');
            await loadAddons();
        } catch (err) {
            setError(extractErrorMessage(err, 'Cập nhật addon thất bại.'));
        } finally {
            setSaving(false);
        }
    };

    const openDelete = (addon: AddonEntry) => {
        setCurrentAddon(addon);
        setShowDeleteApproval(true);
    };


    const handleToggleStatus = async (addon: AddonEntry) => {
        const nextStatus: AddonStatus = addon.status === 'active' ? 'inactive' : 'active';
        try {
            await updateAddonStatus(addon.id, nextStatus);
            setAddons((prev) => prev.map((a) => (a.id === addon.id ? { ...a, status: nextStatus } : a)));
        } catch (err) {
            setError(extractErrorMessage(err, 'Không thể cập nhật trạng thái.'));
        }
    };

    /* ---------- filter offcanvas ---------- */
    const openFilter = () => {
        setDraftItem(itemFilter);
        setDraftStatus(statusFilter);
        setShowFilter(true);
    };

    const activeFilterCount = [itemFilter, statusFilter].filter(Boolean).length;

    const applyFilter = () => {
        setItemFilter(draftItem);
        setStatusFilter(draftStatus);
        setPage(1);
        setShowFilter(false);
    };

    const resetFilter = () => {
        setDraftItem('');
        setDraftStatus('');
        setItemFilter('');
        setStatusFilter('');
        setPage(1);
        setShowFilter(false);
    };

    /* ---------- render ---------- */
    return (
        <>
            {/* ---- Page Header ---- */}
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-3 mb-4">
                <div className="flex-grow-1">
                    <h3 className="mb-0">
                        Addons
                        <Button
                            variant="white"
                            size="sm"
                            className="btn-icon rounded-circle ms-2"
                            aria-label="refresh"
                            onClick={() => loadAddons()}
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
                                    placeholder="Search addon"
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
                                {activeFilterCount > 0 && (
                                    <Badge bg="primary" className="ms-2">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>

                            <Dropdown autoClose="outside">
                                <Dropdown.Toggle as={Button} variant="white" className="btn-icon">
                                    <Icon name="columns-3" />
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="dropdown-menu-md dropdown-menu-end p-3 pb-0">
                                    <h5 className="mb-3">Column</h5>
                                    {columns.map((col) => (
                                        <div className="mb-3 drag-item" key={col.key}>
                                            <label className="d-flex align-items-center">
                                                <Icon name="grip-vertical" className="me-2" />
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={col.visible}
                                                    onChange={() => toggleColumn(col.key)}
                                                    label={col.label}
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>

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
                                    {columns
                                        .filter((c) => c.visible)
                                        .map((c) => (
                                            <th key={c.key}>{c.label}</th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={columns.filter((c) => c.visible).length} className="text-center py-4">
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Loading...
                                        </td>
                                    </tr>
                                )}

                                {!loading && addons.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.filter((c) => c.visible).length} className="text-center py-4 text-muted">
                                            No addons found.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    addons.map((addon) => {
                                        const imageUrl = getAddonImageUrl(addon.imagePath);
                                        return (
                                            <tr key={addon.id}>
                                                {isColumnVisible('item') && <td>{addon.itemName}</td>}
                                                {isColumnVisible('addon') && (
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar avatar-sm avatar-rounded flex-shrink-0 me-2 bg-light d-flex align-items-center justify-content-center">
                                                                {imageUrl ? (
                                                                    <img src={imageUrl} alt={addon.name} className="img-fluid" />
                                                                ) : (
                                                                    <Icon name="image" className="text-secondary" />
                                                                )}
                                                            </div>
                                                            <h6 className="fs-14 fw-normal mb-0">{addon.name}</h6>
                                                        </div>
                                                    </td>
                                                )}
                                                {isColumnVisible('price') && <td>{formatCurrency(addon.price)}</td>}
                                                {isColumnVisible('status') && (
                                                    <td>
                                                        <Badge
                                                            bg=""
                                                            role="button"
                                                            className={
                                                                addon.status === 'active'
                                                                    ? 'badge-soft-success'
                                                                    : 'badge-soft-danger'
                                                            }
                                                            onClick={() => handleToggleStatus(addon)}
                                                            title="Click to toggle status"
                                                        >
                                                            {addon.status === 'active' ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </td>
                                                )}
                                                {isColumnVisible('actions') && (
                                                    <td>
                                                        <Button
                                                            variant="white"
                                                            size="sm"
                                                            className="btn-icon rounded-circle me-2"
                                                            onClick={() => openEdit(addon)}
                                                            title="Edit"
                                                        >
                                                            <Icon name="pencil-line" />
                                                        </Button>
                                                        <Button
                                                            variant="white"
                                                            size="sm"
                                                            className="btn-icon rounded-circle"
                                                            onClick={() => openDelete(addon)}
                                                            title="Delete"
                                                        >
                                                            <Icon name="trash-2" />
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3">
                        <p className="mb-0 text-muted fs-13">
                            Showing {addons.length === 0 ? 0 : (page - 1) * size + 1}-
                            {(page - 1) * size + addons.length} of {totalElements} addons
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
                { show: showAdd, setShow: setShowAdd, title: 'Add Addon', onSubmit: handleAdd, isEdit: false },
                { show: showEdit, setShow: setShowEdit, title: 'Edit Addon', onSubmit: handleEdit, isEdit: true },
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
                                    ) : isEdit && currentAddon && getAddonImageUrl(currentAddon.imagePath) ? (
                                        <img
                                            src={getAddonImageUrl(currentAddon.imagePath)}
                                            alt={currentAddon.name}
                                            className="img-fluid"
                                        />
                                    ) : (
                                        <Icon name="images" className="fs-28 text-dark" />
                                    )}
                                </div>
                                <div>
                                    <Form.Label>Addon Image</Form.Label>
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
                                    Item<span className="text-danger"> *</span>
                                </Form.Label>
                                <Form.Select
                                    value={form.itemId}
                                    onChange={(e) => setForm((p) => ({ ...p, itemId: e.target.value }))}
                                    required
                                >
                                    <option value="">Select</option>
                                    {itemOptions.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            {i.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Addon<span className="text-danger"> *</span>
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
                                    Price<span className="text-danger"> *</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={form.price}
                                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Description<span className="text-danger"> *</span>
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={form.description}
                                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                    required
                                />
                            </Form.Group>

                            {isEdit && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        value={form.status}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, status: e.target.value as AddonStatus }))
                                        }
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </Form.Select>
                                </Form.Group>
                            )}

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


            {/* ---- Delete Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showDeleteApproval}
                onHide={() => setShowDeleteApproval(false)}
                actionLabel="delete"
                requestType="DELETE_IMPORTANT_DATA"
                description={`Xóa addon ${currentAddon?.name ?? ''}`}
                targetType="ADDON"
                targetId={currentAddon?.id}
                targetDisplay={currentAddon?.name}
                additionalData={
                    currentAddon ? JSON.stringify({ targetType: 'ADDON', targetId: currentAddon.id }) : null
                }
                onSent={() => {
                    setShowDeleteApproval(false);
                    setCurrentAddon(null);
                    setNotice('Yêu cầu xóa addon đã được gửi.');
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
                            <Form.Label>Item</Form.Label>
                            <Form.Select
                                value={draftItem}
                                onChange={(e) => setDraftItem(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">All</option>
                                {itemOptions.map((i) => (
                                    <option key={i.id} value={i.id}>
                                        {i.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                value={draftStatus}
                                onChange={(e) => setDraftStatus(e.target.value as AddonStatus | '')}
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

export default AddonsPage;
