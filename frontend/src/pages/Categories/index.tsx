import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Button, Modal, Form, Offcanvas, Alert } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import ApprovalRequestModal from '@/components/common/ApprovalRequestModal';
import {
    createCategory,
    getCategories,
    getCategoryImageUrl,
    updateCategory,
    updateCategoryStatus,
    type CategoryEntry,
    type CategoryStatus,
} from '@/api/category.api';
import CategoryHeader from './components/CategoryHeader';
import { type ColumnOption, defaultColumns, type SortOption, sortLabels, type CategoryForm, emptyForm } from './types';

import { extractErrorMessage } from './utils/category.utils';

import CategoryToolbar from './components/CategoryToolbar';
import CategoryTable from './components/CategoryTable';

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const CategoriesPage = () => {
    /* ---------- data state ---------- */
    const [categories, setCategories] = useState<CategoryEntry[]>([]);
    const [columns, setColumns] = useState<ColumnOption[]>(defaultColumns);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    /* ---------- query state ---------- */
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<CategoryStatus | ''>('');
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
    const [currentCategory, setCurrentCategory] = useState<CategoryEntry | null>(null);
    const [saving, setSaving] = useState(false);

    /* ---------- form state ---------- */
    const [form, setForm] = useState<CategoryForm>(emptyForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ---------- filter draft (offcanvas) ---------- */
    const [draftStatus, setDraftStatus] = useState<CategoryStatus | ''>('');

    /* ---------- helpers ---------- */
    const toggleColumn = (key: string) =>
        setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));

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

    /* ---------- data loading ---------- */
    const loadCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCategories({
                page,
                size,
                sortBy: sortParams.sortBy,
                sortDir: sortParams.sortDir,
                search: search || undefined,
                status: statusFilter || undefined,
            });
            setCategories(result.items);
            setTotalPages(result.totalPages || 1);
            setTotalElements(result.totalElements);
        } catch {
            setError('Failed to load categories. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, size, sortParams, search, statusFilter]);

    // Debounce search input -> search
    useEffect(() => {
        const handle = setTimeout(() => {
            setPage(1);
            setSearch(searchInput.trim());
        }, 400);
        return () => clearTimeout(handle);
    }, [searchInput]);

    // Auto-dismiss notices
    useEffect(() => {
        if (!notice) return;
        const handle = setTimeout(() => setNotice(null), 3000);
        return () => clearTimeout(handle);
    }, [notice]);

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

    /* ---------- CRUD actions ---------- */
    const openAdd = () => {
        resetForm();
        setShowAdd(true);
    };

    const handleAdd = async () => {
        setSaving(true);
        setError(null);
        try {
            await createCategory({ name: form.name.trim(), status: form.status, image: imageFile });
            setShowAdd(false);
            resetForm();
            setNotice('Category added successfully.');
            setPage(1);
            await loadCategories();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to add category.'));
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (category: CategoryEntry) => {
        setCurrentCategory(category);
        setForm({ name: category.name, status: category.status });
        setImageFile(null);
        setImagePreview(null);
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!currentCategory) return;
        setSaving(true);
        setError(null);
        try {
            await updateCategory(currentCategory.id, {
                name: form.name.trim(),
                status: form.status,
                image: imageFile,
            });
            setShowEdit(false);
            setCurrentCategory(null);
            resetForm();
            setNotice('Category updated successfully.');
            await loadCategories();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to update category.'));
        } finally {
            setSaving(false);
        }
    };

    const openDelete = (category: CategoryEntry) => {
        setCurrentCategory(category);
        setShowDeleteApproval(true);
    };


    const handleToggleStatus = async (category: CategoryEntry) => {
        const nextStatus: CategoryStatus = category.status === 'active' ? 'inactive' : 'active';
        try {
            await updateCategoryStatus(category.id, nextStatus);
            setCategories((prev) => prev.map((c) => (c.id === category.id ? { ...c, status: nextStatus } : c)));
        } catch (err) {
            setError(extractErrorMessage(err, 'Cannot update status.'));
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

    /* ---------- render ---------- */
    return (
        <>
            {/* ---- Page Header ---- */}
            <CategoryHeader onRefresh={loadCategories} onAdd={openAdd} />

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
                    <CategoryToolbar
                        searchInput={searchInput}
                        setSearchInput={setSearchInput}
                        statusFilter={statusFilter}
                        openFilter={openFilter}
                        columns={columns}
                        toggleColumn={toggleColumn}
                        sortOption={sortOption}
                        setSortOption={setSortOption}
                        setPage={setPage}
                        sortLabels={sortLabels}
                    />

                    {/* Table */}
                    <CategoryTable
                        columns={columns}
                        loading={loading}
                        categories={categories}
                        handleToggleStatus={handleToggleStatus}
                        openEdit={openEdit}
                        openDelete={openDelete}
                    />

                    {/* Pagination */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3">
                        <p className="mb-0 text-muted fs-13">
                            Showing {categories.length === 0 ? 0 : (page - 1) * size + 1}-
                            {(page - 1) * size + categories.length} of {totalElements} categories
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
            {/*  MODALS                                                          */}
            {/* ================================================================ */}

            {/* ---- Add Category Modal ---- */}
            <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Add Category</h4>
                </Modal.Header>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAdd();
                    }}
                >
                    <Modal.Body className="p-4 pt-1">
                        <div className="mb-3 d-flex align-items-center flex-wrap gap-3">
                            <div className="avatar avatar-3xl border bg-light d-flex align-items-center justify-content-center overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="preview" className="img-fluid" />
                                ) : (
                                    <Icon name="images" className="fs-28 text-dark" />
                                )}
                            </div>
                            <div>
                                <Form.Label>
                                    Category Image<span className="text-danger"> *</span>
                                </Form.Label>
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
                                Category Name<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                required
                            />
                        </Form.Group>

                        <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                            <Button variant="light" className="w-100" onClick={() => setShowAdd(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" className="w-100" disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* ---- Edit Category Modal ---- */}
            <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Edit Category</h4>
                </Modal.Header>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleEdit();
                    }}
                >
                    <Modal.Body className="p-4 pt-1">
                        <div className="mb-3 d-flex align-items-center flex-wrap gap-3">
                            <div className="avatar avatar-3xl avatar-rounded border bg-light d-flex align-items-center justify-content-center overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="preview" className="img-fluid" />
                                ) : currentCategory && getCategoryImageUrl(currentCategory.imagePath) ? (
                                    <img
                                        src={getCategoryImageUrl(currentCategory.imagePath)}
                                        alt={currentCategory.name}
                                        className="img-fluid"
                                    />
                                ) : (
                                    <Icon name="images" className="fs-28 text-dark" />
                                )}
                            </div>
                            <div>
                                <Form.Label>
                                    Category Image<span className="text-danger"> *</span>
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
                                        <Icon name="pencil-line" />
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
                                Category Name<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                value={form.status}
                                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as CategoryStatus }))}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Form.Group>

                        <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                            <Button variant="light" className="w-100" onClick={() => setShowEdit(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" className="w-100" disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>


            {/* ---- Delete Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showDeleteApproval}
                onHide={() => setShowDeleteApproval(false)}
                actionLabel="delete"
                requestType="DELETE_IMPORTANT_DATA"
                description={`Delete category ${currentCategory?.name ?? ''}`}
                targetType="CATEGORY"
                targetId={currentCategory?.id}
                targetDisplay={currentCategory?.name}
                additionalData={
                    currentCategory
                        ? JSON.stringify({ targetType: 'CATEGORY', targetId: currentCategory.id })
                        : null
                }
                onSent={() => {
                    setShowDeleteApproval(false);
                    setCurrentCategory(null);
                    setNotice('Delete category request sent.');
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
                                onChange={(e) => setDraftStatus(e.target.value as CategoryStatus | '')}
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

export default CategoriesPage;
