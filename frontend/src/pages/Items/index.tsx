import { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, Card, Button, Dropdown, Modal, Form, Offcanvas, Spinner, Badge } from 'react-bootstrap';
import { isAxiosError } from 'axios';
import Icon from '@/components/common/Icon';
import ApprovalRequestModal from '@/components/common/ApprovalRequestModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import useAuth from '@/hooks/useAuth';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import { getAssetUrl } from '@/lib';
import {
    createItem,
    deleteItem,
    getCategoryOptions,
    getItem,
    getItems,
    getTaxOptions,
    updateItem,
    updateItemStatus,
    type FoodType,
    type ItemAddon,
    type ItemDetail,
    type ItemEntry,
    type ItemStatus,
    type ItemVariation,
    type Option,
} from '@/api/item.api';

/* ------------------------------------------------------------------ */
/*  Static option lists                                               */
/* ------------------------------------------------------------------ */
const foodTypeLabels: Record<FoodType, string> = {
    veg: 'Veg',
    non_veg: 'Non Veg',
    egg: 'Egg',
};

const foodTypeColors: Record<FoodType, string> = {
    veg: 'text-success',
    non_veg: 'text-danger',
    egg: 'text-warning',
};

type SortOption = 'newest' | 'oldest' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc';

const sortLabels: Record<SortOption, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    priceAsc: 'Price: Low to High',
    priceDesc: 'Price: High to Low',
    nameAsc: 'Name: A to Z',
    nameDesc: 'Name: Z to A',
};

const emptyVariation = (): ItemVariation => ({ sizeName: '', price: 0 });
const emptyAddon = (): ItemAddon => ({ name: '', price: 0, description: '' });

const emptyForm = {
    name: '',
    description: '',
    price: '',
    netPrice: '',
    categoryId: '',
    taxId: '',
    foodType: 'veg' as FoodType,
    status: 'active' as ItemStatus,
};

const formatCurrency = (value: number | null | undefined) =>
    value === null || value === undefined ? '-' : `$${Number(value).toFixed(2)}`;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
const ItemsPage = () => {
    const { showToast } = useContextData(ToastContext);
    /* ---------- data state ---------- */
    const [items, setItems] = useState<ItemEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
    const [taxOptions, setTaxOptions] = useState<Option[]>([]);

    /* ---------- query state ---------- */
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
    const [foodTypeFilter, setFoodTypeFilter] = useState<FoodType | ''>('');
    const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>('');
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [page, setPage] = useState(1);
    const [size] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    /* ---------- modal state ---------- */
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showHide, setShowHide] = useState(false);
    const [showDeleteApproval, setShowDeleteApproval] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showPriceApproval, setShowPriceApproval] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [currentItem, setCurrentItem] = useState<ItemEntry | null>(null);
    const [detail, setDetail] = useState<ItemDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hiding, setHiding] = useState(false);

    /* ---------- form state ---------- */
    const [form, setForm] = useState(emptyForm);
    const [variations, setVariations] = useState<ItemVariation[]>([]);
    const [addons, setAddons] = useState<ItemAddon[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ---------- filter draft (offcanvas) ---------- */
    const [draftCategory, setDraftCategory] = useState<number | ''>('');
    const [draftFoodType, setDraftFoodType] = useState<FoodType | ''>('');
    const [draftStatus, setDraftStatus] = useState<ItemStatus | ''>('');

    /* ---------- helpers ---------- */
    const resetForm = () => {
        setForm(emptyForm);
        setVariations([]);
        setAddons([]);
        setImageFile(null);
        setImagePreview(null);
    };

    const sortParams = useMemo(() => {
        switch (sortOption) {
            case 'oldest':
                return { sortBy: 'createdAt', sortDir: 'asc' };
            case 'priceAsc':
                return { sortBy: 'price', sortDir: 'asc' };
            case 'priceDesc':
                return { sortBy: 'price', sortDir: 'desc' };
            case 'nameAsc':
                return { sortBy: 'name', sortDir: 'asc' };
            case 'nameDesc':
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
                const [categories, taxes] = await Promise.all([getCategoryOptions(), getTaxOptions()]);
                setCategoryOptions(categories);
                setTaxOptions(taxes);
            } catch {
                // Non-fatal: form selects will simply be empty until retried.
            }
        })();
    }, []);

    /* ---------- data loading ---------- */
    const loadItems = async () => {
        setLoading(true);
        try {
            const result = await getItems({
                page,
                size,
                sortBy: sortParams.sortBy,
                sortDir: sortParams.sortDir,
                search: search || undefined,
                categoryId: categoryFilter || undefined,
                foodType: foodTypeFilter || undefined,
                status: statusFilter || undefined,
            });
            setItems(result.items);
            setTotalPages(result.totalPages || 1);
            setTotalElements(result.totalElements);
        } catch {
            showToast('error', 'Failed to load items. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, size, sortParams, search, categoryFilter, foodTypeFilter, statusFilter]);

    useEffect(() => {
        const handle = setTimeout(() => {
            setPage(1);
            setSearch(searchInput.trim());
        }, 400);
        return () => clearTimeout(handle);
    }, [searchInput]);


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

    /* ---------- variations / addons repeaters ---------- */
    const addVariationRow = () => setVariations((prev) => [...prev, emptyVariation()]);
    const removeVariationRow = (index: number) =>
        setVariations((prev) => prev.filter((_, i) => i !== index));
    const updateVariationRow = (index: number, patch: Partial<ItemVariation>) =>
        setVariations((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));

    const addAddonRow = () => setAddons((prev) => [...prev, emptyAddon()]);
    const removeAddonRow = (index: number) => setAddons((prev) => prev.filter((_, i) => i !== index));
    const updateAddonRow = (index: number, patch: Partial<ItemAddon>) =>
        setAddons((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));

    const buildPayload = () => ({
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        netPrice: form.netPrice ? Number(form.netPrice) : null,
        categoryId: Number(form.categoryId),
        taxId: form.taxId ? Number(form.taxId) : null,
        foodType: form.foodType,
        status: form.status,
        image: imageFile,
        variations,
        addons,
    });

    /* ---------- CRUD actions ---------- */
    const openAdd = () => {
        resetForm();
        setShowAdd(true);
    };

    const handleAdd = async () => {
        setSaving(true);
        try {
            await createItem(buildPayload());
            setShowAdd(false);
            resetForm();
            showToast('success', 'Item added successfully.');
            setPage(1);
            await loadItems();
        } catch (err) {
            const message = extractErrorMessage(err, 'Failed to add item.');
            showToast('error', message);
        } finally {
            setSaving(false);
        }
    };

    const openEdit = async (item: ItemEntry) => {
        setCurrentItem(item);
        setImageFile(null);
        setImagePreview(null);
        setShowEdit(true);
        setSaving(false);

        try {
            const full = await getItem(item.id);
            setForm({
                name: full.name,
                description: full.description,
                price: String(full.price),
                netPrice: full.netPrice !== null ? String(full.netPrice) : '',
                categoryId: String(full.categoryId),
                taxId: full.taxId ? String(full.taxId) : '',
                foodType: full.foodType,
                status: full.status,
            });
            setVariations(full.variations.map((v) => ({ ...v })));
            setAddons(full.addons.map((a) => ({ ...a })));
        } catch (err) {
            showToast('error', extractErrorMessage(err, 'Failed to load item details.'));
            setShowEdit(false);
        }
    };

    const { isAdmin } = useAuth();

    const handleEdit = async () => {
        if (!currentItem) return;

        // Price changes require approval before they take effect — but admins
        // change prices directly.
        if (Number(form.price) !== Number(currentItem.price) && !isAdmin) {
            setShowEdit(false);
            setShowPriceApproval(true);
            return;
        }

        setSaving(true);
        try {
            await updateItem(currentItem.id, buildPayload());
            setShowEdit(false);
            setCurrentItem(null);
            resetForm();
            showToast('success', 'Item updated successfully.');
            await loadItems();
        } catch (err) {
            const message = extractErrorMessage(err, 'Failed to update item.');
            showToast('error', message);
        } finally {
            setSaving(false);
        }
    };

    const openDetails = async (item: ItemEntry) => {
        setCurrentItem(item);
        setDetail(null);
        setShowDetails(true);
        setDetailLoading(true);
        try {
            const full = await getItem(item.id);
            setDetail(full);
        } catch (err) {
            showToast('error', extractErrorMessage(err, 'Failed to load item details.'));
            setShowDetails(false);
        } finally {
            setDetailLoading(false);
        }
    };

    // Delete requires approval before it is applied on the system — admins
    // delete directly after a confirmation.
    const openDeleteApproval = (item: ItemEntry) => {
        setCurrentItem(item);
        if (isAdmin) {
            setShowDeleteConfirm(true);
        } else {
            setShowDeleteApproval(true);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!currentItem) return;
        setDeleting(true);
        try {
            await deleteItem(currentItem.id);
            setShowDeleteConfirm(false);
            setCurrentItem(null);
            showToast('success', 'Item deleted successfully.');
            await loadItems();
        } catch (err) {
            const message = extractErrorMessage(err, 'Failed to delete item.');
            showToast('error', message);
        } finally {
            setDeleting(false);
        }
    };

    const openHide = (item: ItemEntry) => {
        setCurrentItem(item);
        setShowHide(true);
    };

    const handleHide = async () => {
        if (!currentItem) return;
        setHiding(true);
        try {
            const nextStatus: ItemStatus = currentItem.status === 'hidden' ? 'active' : 'hidden';
            await updateItemStatus(currentItem.id, nextStatus);
            setShowHide(false);
            setCurrentItem(null);
            showToast('success', nextStatus === 'hidden' ? 'Item hidden.' : 'Item made visible again.');
            await loadItems();
        } catch (err) {
            const message = extractErrorMessage(err, 'Cannot update item status.');
            showToast('error', message);
        } finally {
            setHiding(false);
        }
    };

    /* ---------- filter offcanvas ---------- */
    const openFilter = () => {
        setDraftCategory(categoryFilter);
        setDraftFoodType(foodTypeFilter);
        setDraftStatus(statusFilter);
        setShowFilter(true);
    };

    const activeFilterCount = [categoryFilter, foodTypeFilter, statusFilter].filter(Boolean).length;

    const applyFilter = () => {
        setCategoryFilter(draftCategory);
        setFoodTypeFilter(draftFoodType);
        setStatusFilter(draftStatus);
        setPage(1);
        setShowFilter(false);
    };

    const resetFilter = () => {
        setDraftCategory('');
        setDraftFoodType('');
        setDraftStatus('');
        setCategoryFilter('');
        setFoodTypeFilter('');
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
                        Items
                        <Button
                            variant="white"
                            size="sm"
                            className="btn-icon rounded-circle ms-2"
                            aria-label="refresh"
                            onClick={() => loadItems()}
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
                    <Button
                        variant="white"
                        className="d-inline-flex align-items-center"
                        onClick={openFilter}
                    >
                        <Icon name="funnel" className="me-2" />
                        Filter
                        {activeFilterCount > 0 && (
                            <Badge bg="primary" className="ms-2">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                    <Dropdown>
                        <Dropdown.Toggle
                            as={Button}
                            variant="white"
                            className="d-inline-flex align-items-center"
                        >
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


            {/* ---- Item grid ---- */}
            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" className="me-2" />
                    Loading...
                </div>
            )}

            {!loading && items.length === 0 && (
                <div className="text-center py-5 text-muted">No items found.</div>
            )}

            {!loading && items.length > 0 && (
                <Row>
                    {items.map((item) => {
                        const imageUrl = getAssetUrl(item.imagePath);
                        return (
                            <Col lg={3} md={4} sm={6} key={item.id}>
                                <Card>
                                    <Card.Body>
                                        <div className="food-items position-relative">
                                            <a
                                                href="#!"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    openDetails(item);
                                                }}
                                            >
                                                <div className="mb-3 w-100 rounded bg-light d-flex align-items-center justify-content-center overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
                                                    {imageUrl ? (
                                                        <img src={imageUrl} alt={item.name} className="img-fluid w-100 h-100" style={{ objectFit: 'cover' }} />
                                                    ) : (
                                                        <Icon name="image" className="fs-2 text-secondary" />
                                                    )}
                                                </div>
                                            </a>
                                            <Dropdown className="food-items-menu position-absolute top-0 end-0">
                                                <Dropdown.Toggle
                                                    as="a"
                                                    className="text-dark"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <Icon name="ellipsis-vertical" />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu align="end">
                                                    <Dropdown.Item onClick={() => openEdit(item)}>
                                                        <Icon name="pencil-line" className="me-2" />
                                                        Edit Item
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => openDeleteApproval(item)}>
                                                        <Icon name="trash-2" className="me-2" />
                                                        Delete
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => openHide(item)}>
                                                        <Icon name="eye-off" className="me-2" />
                                                        {item.status === 'hidden' ? 'Show Item' : 'Hide Item'}
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>
                                        <h6 className="fs-14 fw-semibold">
                                            <a
                                                href="#!"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    openDetails(item);
                                                }}
                                            >
                                                {item.name}
                                            </a>
                                            {item.status === 'hidden' && (
                                                <Badge bg="" className="badge-soft-secondary ms-2">
                                                    Hidden
                                                </Badge>
                                            )}
                                        </h6>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <p className="mb-0">{formatCurrency(item.price)}</p>
                                            <div>
                                                <span className="d-flex align-items-center">
                                                    <Icon name="square-dot" className={`${foodTypeColors[item.foodType]} me-1`} />
                                                    {foodTypeLabels[item.foodType]}
                                                </span>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* ---- Pagination ---- */}
            {!loading && items.length > 0 && (
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2">
                    <p className="mb-0 text-muted fs-13">
                        Showing {(page - 1) * size + 1}-{(page - 1) * size + items.length} of {totalElements} items
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

            {/* ================================================================ */}
            {/*  ADD / EDIT MODAL                                                 */}
            {/* ================================================================ */}
            {[
                { show: showAdd, setShow: setShowAdd, title: 'Add Item', onSubmit: handleAdd, isEdit: false },
                { show: showEdit, setShow: setShowEdit, title: 'Edit Item', onSubmit: handleEdit, isEdit: true },
            ].map(({ show, setShow, title, onSubmit, isEdit }) => (
                <Modal key={title} show={show} onHide={() => setShow(false)} centered size="lg">
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
                            <Row>
                                <Col lg={12}>
                                    <div className="mb-3 d-flex align-items-center flex-wrap gap-3">
                                        <div
                                            className="avatar avatar-3xl border bg-light d-flex align-items-center justify-content-center overflow-hidden"
                                        >
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="preview" className="img-fluid" />
                                            ) : isEdit && currentItem && getAssetUrl(currentItem.imagePath) ? (
                                                <img
                                                    src={getAssetUrl(currentItem.imagePath)}
                                                    alt={currentItem.name}
                                                    className="img-fluid"
                                                />
                                            ) : (
                                                <Icon name="images" className="fs-28 text-dark" />
                                            )}
                                        </div>
                                        <div>
                                            <Form.Label>
                                                Item Image<span className="text-danger"> *</span>
                                            </Form.Label>
                                            <p className="fs-13 mb-3">Image should be within 5 MB</p>
                                            <div className="d-flex align-items-center">
                                                <div className="btn btn-icon btn-sm btn-white rounded-circle position-relative me-2">
                                                    <Form.Control
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
                                </Col>

                                <Col lg={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Item Name<span className="text-danger"> *</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>

                                <Col lg={12}>
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
                                </Col>

                                <Col lg={6}>
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
                                </Col>
                                <Col lg={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Net Price</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={form.netPrice}
                                            onChange={(e) => setForm((p) => ({ ...p, netPrice: e.target.value }))}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col lg={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Category<span className="text-danger"> *</span>
                                        </Form.Label>
                                        <Form.Select
                                            value={form.categoryId}
                                            onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                                            required
                                        >
                                            <option value="">Select</option>
                                            {categoryOptions.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col lg={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tax</Form.Label>
                                        <Form.Select
                                            value={form.taxId}
                                            onChange={(e) => setForm((p) => ({ ...p, taxId: e.target.value }))}
                                        >
                                            <option value="">Select</option>
                                            {taxOptions.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col lg={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Food Type</Form.Label>
                                        <Form.Select
                                            value={form.foodType}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, foodType: e.target.value as FoodType }))
                                            }
                                        >
                                            <option value="veg">Veg</option>
                                            <option value="non_veg">Non Veg</option>
                                            <option value="egg">Egg</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col lg={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Select
                                            value={form.status}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, status: e.target.value as ItemStatus }))
                                            }
                                        >
                                            <option value="active">Active</option>
                                            <option value="hidden">Hidden</option>
                                            <option value="inactive">Inactive</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Variations */}
                            <div className="border rounded p-3 mb-3">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <h5 className="mb-0">Variations</h5>
                                </div>
                                {variations.map((v, index) => (
                                    <Row key={index} className="align-items-center mb-2">
                                        <Col lg={5}>
                                            <Form.Control
                                                type="text"
                                                placeholder="Size (e.g. Small)"
                                                value={v.sizeName}
                                                onChange={(e) => updateVariationRow(index, { sizeName: e.target.value })}
                                            />
                                        </Col>
                                        <Col lg={5}>
                                            <Form.Control
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                placeholder="Price"
                                                value={v.price}
                                                onChange={(e) =>
                                                    updateVariationRow(index, { price: Number(e.target.value) })
                                                }
                                            />
                                        </Col>
                                        <Col lg={2}>
                                            <Button
                                                variant="white"
                                                size="sm"
                                                className="btn-icon rounded-circle"
                                                onClick={() => removeVariationRow(index)}
                                            >
                                                <Icon name="trash-2" className="text-danger" />
                                            </Button>
                                        </Col>
                                    </Row>
                                ))}
                                <Button variant="light" size="sm" onClick={addVariationRow}>
                                    <Icon name="plus" className="me-1" />
                                    Add
                                </Button>
                            </div>

                            {/* Add Ons */}
                            <div className="border rounded p-3 mb-3">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <h5 className="mb-0">Add Ons</h5>
                                </div>
                                {addons.map((a, index) => (
                                    <Row key={index} className="align-items-center mb-2">
                                        <Col lg={4}>
                                            <Form.Control
                                                type="text"
                                                placeholder="Name"
                                                value={a.name}
                                                onChange={(e) => updateAddonRow(index, { name: e.target.value })}
                                            />
                                        </Col>
                                        <Col lg={3}>
                                            <Form.Control
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                placeholder="Price($)"
                                                value={a.price}
                                                onChange={(e) =>
                                                    updateAddonRow(index, { price: Number(e.target.value) })
                                                }
                                            />
                                        </Col>
                                        <Col lg={3}>
                                            <Form.Control
                                                type="text"
                                                placeholder="Description"
                                                value={a.description ?? ''}
                                                onChange={(e) =>
                                                    updateAddonRow(index, { description: e.target.value })
                                                }
                                            />
                                        </Col>
                                        <Col lg={2}>
                                            <Button
                                                variant="white"
                                                size="sm"
                                                className="btn-icon rounded-circle"
                                                onClick={() => removeAddonRow(index)}
                                            >
                                                <Icon name="trash-2" className="text-danger" />
                                            </Button>
                                        </Col>
                                    </Row>
                                ))}
                                <Button variant="light" size="sm" onClick={addAddonRow}>
                                    <Icon name="plus" className="me-1" />
                                    Add
                                </Button>
                            </div>

                            <div className="d-flex align-items-center justify-content-end gap-2">
                                <Button variant="light" onClick={() => setShow(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Item'}
                                </Button>
                            </div>
                        </Modal.Body>
                    </Form>
                </Modal>
            ))}

            {/* ================================================================ */}
            {/*  ITEM DETAILS MODAL                                               */}
            {/* ================================================================ */}
            <Modal show={showDetails} onHide={() => setShowDetails(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 p-4 pb-0">
                    <h4 className="modal-title">Item Details</h4>
                </Modal.Header>
                <Modal.Body className="p-4 pt-1">
                    {detailLoading && (
                        <div className="text-center py-4">
                            <Spinner animation="border" size="sm" className="me-2" />
                            Loading...
                        </div>
                    )}
                    {!detailLoading && detail && (
                        <Row className="row-gap-3">
                            <Col lg={6} sm={12}>
                                <div className="bg-light p-3 rounded d-flex align-items-center justify-content-center" style={{ minHeight: 220 }}>
                                    {getAssetUrl(detail.imagePath) ? (
                                        <img
                                            src={getAssetUrl(detail.imagePath)}
                                            alt={detail.name}
                                            className="img-fluid w-100"
                                        />
                                    ) : (
                                        <Icon name="image" className="fs-1 text-secondary" />
                                    )}
                                </div>
                            </Col>
                            <Col lg={6} sm={12}>
                                <div className="mb-3">
                                    <h5>{detail.name}</h5>
                                    <p>{detail.description}</p>
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="fw-semibold">{formatCurrency(detail.price)}</span>
                                        <span className="d-flex align-items-center">
                                            <Icon name="square-dot" className={`${foodTypeColors[detail.foodType]} me-1`} />
                                            {foodTypeLabels[detail.foodType]}
                                        </span>
                                    </div>
                                    <p className="mb-0 text-muted fs-13 mt-1">
                                        Category: {detail.categoryName}
                                        {detail.taxTitle ? ` • Tax: ${detail.taxTitle}` : ''}
                                    </p>
                                </div>

                                {detail.variations.length > 0 && (
                                    <div className="mb-3 pb-3 border-bottom">
                                        <h6>Sizes</h6>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {detail.variations.map((v) => (
                                                <Badge key={v.id ?? v.sizeName} bg="" className="badge-soft-primary">
                                                    {v.sizeName} — {formatCurrency(v.price)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {detail.addons.length > 0 && (
                                    <div>
                                        <h6 className="mb-2">Add-ons & Upgrades</h6>
                                        <Row className="row-gap-2">
                                            {detail.addons.map((a) => (
                                                <Col lg={6} key={a.id ?? a.name}>
                                                    <div className="border rounded p-2 fs-13">
                                                        {a.name} — {formatCurrency(a.price)}
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
            </Modal>

            {/* ---- Delete Confirmation (admins delete directly) ---- */}
            <ConfirmModal
                show={showDeleteConfirm}
                handleClose={() => setShowDeleteConfirm(false)}
                type="delete"
                action={handleDeleteConfirm}
                data={currentItem?.name ?? ''}
                actionDisabled={deleting}
            />

            {/* ---- Delete Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showDeleteApproval}
                onHide={() => setShowDeleteApproval(false)}
                actionLabel="delete"
                requestType="DELETE_IMPORTANT_DATA"
                description={`Delete item ${currentItem?.name ?? ''}`}
                targetType="ITEM"
                targetId={currentItem?.id}
                targetDisplay={currentItem?.name}
                additionalData={
                    currentItem ? JSON.stringify({ targetType: 'ITEM', targetId: currentItem.id }) : null
                }
                onSent={() => {
                    setShowDeleteApproval(false);
                    setCurrentItem(null);
                    showToast('info', 'Delete item request sent.');
                }}
            />

            {/* ---- Price Change Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showPriceApproval}
                onHide={() => setShowPriceApproval(false)}
                actionLabel="price change"
                requestType="PRICE_CHANGE"
                description={`Change price of item ${currentItem?.name ?? ''}`}
                targetType="ITEM"
                targetId={currentItem?.id}
                targetDisplay={currentItem?.name}
                oldValue={currentItem ? String(currentItem.price) : null}
                newValue={form.price ? String(form.price) : null}
                additionalData={
                    currentItem
                        ? JSON.stringify({
                            itemId: currentItem.id,
                            newPrice: Number(form.price),
                            oldPrice: currentItem.price,
                            itemRequest: {
                                name: form.name,
                                description: form.description,
                                price: Number(form.price),
                                netPrice: form.netPrice ? Number(form.netPrice) : null,
                                categoryId: Number(form.categoryId),
                                taxId: form.taxId ? Number(form.taxId) : null,
                                foodType: form.foodType,
                                status: form.status,
                                variations: JSON.stringify(variations.filter((v) => v.sizeName.trim() !== '')),
                                addons: JSON.stringify(addons.filter((a) => a.name.trim() !== '')),
                            },
                        })
                        : null
                }
                onSent={() => {
                    setShowPriceApproval(false);
                    setCurrentItem(null);
                    resetForm();
                    showToast('info', 'Price change request sent.');
                }}
            />

            {/* ---- Hide Confirmation Modal (non-destructive status toggle) ---- */}
            <Modal show={showHide} onHide={() => setShowHide(false)} centered size="sm">
                <Modal.Body className="text-center p-4">
                    <div className="mb-4">
                        <span className="avatar avatar-xxl rounded-circle bg-info-subtle d-inline-flex align-items-center justify-content-center">
                            <Icon name="eye-off" className="fs-2 text-info" />
                        </span>
                    </div>
                    <h4 className="mb-1">
                        {currentItem?.status === 'hidden' ? 'Show Item Confirmation' : 'Hide Item Confirmation'}
                    </h4>
                    <p className="mb-4">
                        Are you sure you want to {currentItem?.status === 'hidden' ? 'show' : 'hide'} this item?
                    </p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="light" className="w-100" onClick={() => setShowHide(false)}>
                            Close
                        </Button>
                        <Button variant="info" className="w-100 text-white" onClick={handleHide} disabled={hiding}>
                            {hiding ? 'Saving...' : currentItem?.status === 'hidden' ? 'Show' : 'Hide'}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

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
                            <Form.Label>Category</Form.Label>
                            <Form.Select
                                value={draftCategory}
                                onChange={(e) =>
                                    setDraftCategory(e.target.value ? Number(e.target.value) : '')
                                }
                            >
                                <option value="">All</option>
                                {categoryOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Food Type</Form.Label>
                            <Form.Select
                                value={draftFoodType}
                                onChange={(e) => setDraftFoodType(e.target.value as FoodType | '')}
                            >
                                <option value="">All</option>
                                <option value="veg">Veg</option>
                                <option value="non_veg">Non Veg</option>
                                <option value="egg">Egg</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                value={draftStatus}
                                onChange={(e) => setDraftStatus(e.target.value as ItemStatus | '')}
                            >
                                <option value="">All</option>
                                <option value="active">Active</option>
                                <option value="hidden">Hidden</option>
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

export default ItemsPage;
