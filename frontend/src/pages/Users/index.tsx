import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Table,
    Card,
    Badge,
    Button,
    Dropdown,
    Modal,
    Form,
    Offcanvas,
    InputGroup,
    Spinner,
} from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import ApprovalRequestModal from '@/components/common/ApprovalRequestModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import useAuth from '@/hooks/useAuth';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import {
    createUser,
    deleteUser,
    getUsers,
    updateUser,
    getUserPermissions,
    updateUserPermissions,
} from '@/services/api/user.api';
import type {
    PermissionModuleResponse,
} from '@/services/api/user.api';
import { type PermissionModule, type UserEntry, type Status } from '@/types';
import type { UserUpdateRequest } from '@/types/user';
import PageHeader from '@/components/common/PageHeader';
import HeaderUsers from '@/components/headers/HeaderUsers';
import userImages from '@/assets/img/users';
import { api } from '@/lib/axios';
import { getAssetUrl } from '@/lib';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/auth';
import Pagination from '@/components/common/Pagination';

/* ------------------------------------------------------------------ */
/*  Static demo data                                                  */
/* ------------------------------------------------------------------ */
const localImages = Object.values(userImages);

interface RoleOption {
    id: number;
    name: string;
}

const defaultPermissionModules: PermissionModule[] = [
    { module: 'Dashboard', view: false, add: false, edit: false, delete_: false, export_: false, approvedVoid: false },
    { module: 'POS', view: false, add: false, edit: false, delete_: false, export_: false, approvedVoid: false },
    { module: 'Hold/Resume Sale', view: false, add: false, edit: false, delete_: false, export_: false, approvedVoid: false },
    { module: 'Refund / Return', view: false, add: false, edit: false, delete_: false, export_: false, approvedVoid: false },
    { module: 'Products', view: false, add: false, edit: false, delete_: false, export_: false, approvedVoid: false },
    { module: 'Categories', view: false, add: false, edit: false, delete_: false, export_: false, approvedVoid: false },
    { module: 'Customers', view: false, add: false, edit: false, delete_: false, export_: false, approvedVoid: false },
    { module: 'Reports', view: false, add: false, edit: false, delete_: false, export_: false, approvedVoid: false },
    { module: 'Settings', view: false, add: false, edit: false, delete_: false, export_: false, approvedVoid: false },
];

/* ------------------------------------------------------------------ */
/*  Columns visibility helper                                         */
/* ------------------------------------------------------------------ */
interface ColumnOption {
    key: string;
    label: string;
    visible: boolean;
}

const defaultColumns: ColumnOption[] = [
    { key: 'name', label: 'Name', visible: true },
    { key: 'role', label: 'Role', visible: true },
    { key: 'phone', label: 'Phone Number', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'actions', label: 'Actions', visible: true },
];

/* ------------------------------------------------------------------ */
/*  Filter state shape                                                */
/* ------------------------------------------------------------------ */
interface AppliedFilters {
    roleIds: number[];
    status: string; // '' | 'active' | 'inactive'
}

const emptyAppliedFilters: AppliedFilters = { roleIds: [], status: '' };

/* ------------------------------------------------------------------ */
/*  Sort options mapping                                              */
/* ------------------------------------------------------------------ */
type SortOption = 'Newest' | 'Oldest' | 'Ascending' | 'Descending';

const sortConfigMap: Record<SortOption, { sortBy: string; sortDir: string }> = {
    Newest: { sortBy: 'createdAt', sortDir: 'desc' },
    Oldest: { sortBy: 'createdAt', sortDir: 'asc' },
    Ascending: { sortBy: 'firstName', sortDir: 'asc' },
    Descending: { sortBy: 'firstName', sortDir: 'desc' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
const UsersPage = () => {
    const { showToast } = useContextData(ToastContext);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    /* ---------- state ---------- */
    const [users, setUsers] = useState<UserEntry[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [columns, setColumns] = useState<ColumnOption[]>(defaultColumns);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Modals
    const [showAdd, setShowAdd] = useState(false);
    const [showAddApproval, setShowAddApproval] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDeleteApproval, setShowDeleteApproval] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showPermission, setShowPermission] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [sort, setSort] = useState<SortOption>('Newest');
    const [totalItems, setTotalItems] = useState<number>(0);

    // Current user being edited / deleted / detail / permissioned
    const [currentUser, setCurrentUser] = useState<UserEntry | null>(null);
    const [permissions, setPermissions] = useState<PermissionModule[]>(defaultPermissionModules);
    const [loadingPerms, setLoadingPerms] = useState(false);
    const [savingPerms, setSavingPerms] = useState(false);

    // Avatar file state
    const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);

    // Add form state
    const addEmptyForm = {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        roleId: 0,
    };
    const [addForm, setAddForm] = useState(addEmptyForm);

    // Edit form state
    const editEmptyForm = {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        roleId: 0,
        status: 'active' as Status,
    };
    const [editForm, setEditForm] = useState(editEmptyForm);

    /* ---------- live search state (debounced) ---------- */
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input by 300ms
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    /* ---------- filter state ---------- */
    const [draftRoles, setDraftRoles] = useState<number[]>([]);
    const [draftStatus, setDraftStatus] = useState('');
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(emptyAppliedFilters);
    const [filterRoleSearch, setFilterRoleSearch] = useState('');

    /* ---------- fetch users ---------- */
    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const sortConfig = sortConfigMap[sort];
            const result = await getUsers({
                page: currentPage - 1,
                size: PAGE_SIZE,
                sortBy: sortConfig.sortBy,
                sortDir: sortConfig.sortDir,
                search: debouncedSearch || undefined,
                status: appliedFilters.status || undefined,
                roleIds: appliedFilters.roleIds.length > 0 ? appliedFilters.roleIds.join(',') : undefined,
            });
            setUsers(result.items);
            setTotalItems(result.totalElements);
        } catch {
            console.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [sort, currentPage, debouncedSearch, appliedFilters]);

    /* ---------- fetch roles ---------- */
    const loadRoles = useCallback(async () => {
        try {
            const { data } = await api.get<ApiResponse<RoleOption[]>>('/roles');
            setRoles(data.result);
        } catch {
            console.error('Failed to load roles');
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadUsers();
        loadRoles();
    }, [loadUsers, loadRoles]);

    /* ---------- helpers ---------- */
    const toggleColumn = (key: string) =>
        setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));

    /* ---------- avatar handlers ---------- */
    const handleAvatarChange = (file: File | undefined, preview: string | undefined) => {
        setAvatarFile(file);
        setAvatarPreview(preview);
    };

    const clearAvatar = () => {
        setAvatarFile(undefined);
        setAvatarPreview(undefined);
    };

    const { isAdmin } = useAuth();

    /* ---------- add user ---------- */
    const handleAdd = async () => {
        if (addForm.password !== addForm.confirmPassword) {
            showToast('error', 'Passwords do not match');
            return;
        }
        // Creating a user requires approval before it takes effect — admins
        // create users directly.
        if (isAdmin) {
            setSaving(true);
            try {
                await createUser(
                    {
                        firstName: addForm.firstName,
                        lastName: addForm.lastName,
                        email: addForm.email,
                        phoneNumber: addForm.phoneNumber,
                        password: addForm.password,
                        role: addForm.roleId,
                    },
                    avatarFile,
                );
                setShowAdd(false);
                setAddForm(addEmptyForm);
                clearAvatar();
                await loadUsers();
                showToast('success', 'User created successfully.');
            } catch (err: unknown) {
                const msg =
                    (err as AxiosError<{ message?: string }>)?.response?.data?.message || 'Failed to create user';
                showToast('error', msg);
            } finally {
                setSaving(false);
            }
            return;
        }
        setShowAdd(false);
        setShowAddApproval(true);
    };

    /* ---------- edit user ---------- */
    const openEdit = (user: UserEntry) => {
        setCurrentUser(user);
        const roleOption = roles.find((r) => r.name === user.role);
        setEditForm({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            password: '',
            confirmPassword: '',
            roleId: roleOption?.id ?? 0,
            status: user.status as Status,
        });
        setAvatarPreview(undefined);
        setAvatarFile(undefined);
        setShowEdit(true);
    };

    const handleEdit = async () => {
        if (!currentUser) return;
        if (editForm.password && editForm.password !== editForm.confirmPassword) {
            showToast('error', 'Passwords do not match');
            return;
        }
        try {
            const request: UserUpdateRequest = {
                firstName: editForm.firstName || undefined,
                lastName: editForm.lastName || undefined,
                email: editForm.email || undefined,
                phoneNumber: editForm.phoneNumber || undefined,
                role: editForm.roleId > 0 ? editForm.roleId : undefined,
                status: editForm.status as Status,
            };
            if (editForm.password) {
                request.password = editForm.password;
            }
            await updateUser(currentUser.id, request, avatarFile);
            setShowEdit(false);
            setCurrentUser(null);
            setEditForm(editEmptyForm);
            clearAvatar();
            await loadUsers();
            showToast('success', 'User updated successfully.');
        } catch (err: unknown) {
            const msg =
                (err as AxiosError<{ message?: string }>)?.response?.data?.message || 'Failed to update user';
            showToast('error', msg);
        }
    };

    /* ---------- delete user ---------- */
    const openDelete = (user: UserEntry) => {
        setCurrentUser(user);
        if (isAdmin) {
            setShowDeleteConfirm(true);
        } else {
            setShowDeleteApproval(true);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!currentUser) return;
        setDeleting(true);
        try {
            await deleteUser(currentUser.id);
            setShowDeleteConfirm(false);
            setCurrentUser(null);
            await loadUsers();
            showToast('success', 'User deleted successfully.');
        } catch (err: unknown) {
            const msg =
                (err as AxiosError<{ message?: string }>)?.response?.data?.message || 'Failed to delete user';
            showToast('error', msg);
        } finally {
            setDeleting(false);
        }
    };

    /* ---------- detail ---------- */
    const openDetail = (user: UserEntry) => {
        setCurrentUser(user);
        setShowDetail(true);
    };

    /* ---------- permission ---------- */
    const openPermission = async (user: UserEntry) => {
        setCurrentUser(user);
        setPermissions(defaultPermissionModules.map((m) => ({ ...m })));
        setShowPermission(true);
        setLoadingPerms(true);
        try {
            const result = await getUserPermissions(user.id);
            setPermissions(
                result.permissions.map((p: PermissionModuleResponse) => ({
                    module: p.module,
                    view: p.view,
                    add: p.add,
                    edit: p.edit,
                    delete_: p.delete_,
                    export_: p.export_,
                    approvedVoid: p.approvedVoid,
                })),
            );
        } catch {
            // Keep default permissions on error
        } finally {
            setLoadingPerms(false);
        }
    };

    const togglePermission = (moduleIdx: number, field: keyof Omit<PermissionModule, 'module'>) => {
        setPermissions((prev) =>
            prev.map((m, i) => (i === moduleIdx ? { ...m, [field]: !m[field] } : m)),
        );
    };

    const handleSavePermissions = async () => {
        if (!currentUser) return;
        setSavingPerms(true);
        try {
            const payload = permissions.map((p) => ({
                module: p.module,
                view: p.view,
                add: p.add,
                edit: p.edit,
                delete_: p.delete_,
                export_: p.export_,
                approvedVoid: p.approvedVoid,
            }));
            await updateUserPermissions(currentUser.id, payload);
            setShowPermission(false);
            showToast('success', 'Permissions saved successfully.');
        } catch {
            showToast('error', 'Failed to save permissions');
        } finally {
            setSavingPerms(false);
        }
    };

    /* ---------- filter offcanvas helpers ---------- */
    const openFilter = () => {
        // sync draft with currently applied filters whenever the panel opens
        setDraftRoles(appliedFilters.roleIds);
        setDraftStatus(appliedFilters.status);
        setShowFilter(true);
    };

    const toggleDraftRole = (roleId: number) => {
        setDraftRoles((prev) => (prev.includes(roleId) ? prev.filter((x) => x !== roleId) : [...prev, roleId]));
    };

    const handleApplyFilter = () => {
        setAppliedFilters({ roleIds: draftRoles, status: draftStatus });
        setShowFilter(false);
    };

    const handleResetFilter = () => {
        setDraftRoles([]);
        setDraftStatus('');
        setFilterRoleSearch('');
        setAppliedFilters(emptyAppliedFilters);
    };

    const filteredRoleOptions = useMemo(
        () =>
            roles.filter((r) =>
                r.name.toLowerCase().includes(filterRoleSearch.trim().toLowerCase()),
            ),
        [roles, filterRoleSearch],
    );


    /* ---------- render ---------- */
    return (
        <>
            {/* ---- Page Header ---- */}
            <PageHeader
                title="User"
                onRefresh={loadUsers}
                action={HeaderUsers(users, () => {
                    setAddForm(addEmptyForm);
                    clearAvatar();
                    setShowAdd(true);
                }, () => setShowAdd(true))}
            />

            {/* ---- Card with table ---- */}
            <Card className="mb-0">
                <Card.Body>
                    {/* Toolbar */}
                    <div className="d-flex align-items-center flex-wrap gap-3 justify-content-between mb-4">
                        <div className="search-input">
                            <div className="datatable-search position-relative">
                                <input
                                    className="form-control form-control-sm"
                                    placeholder="Search"
                                    aria-controls="DataTables_Table_0"
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                <Icon name="search" className="position-absolute top-50 end-0 translate-middle-y me-3 text-secondary" />
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            {/* Filter */}
                            <Button
                                variant="white"
                                className="d-inline-flex align-items-center position-relative"
                                onClick={openFilter}
                            >
                                <Icon name="funnel" className="me-2" />
                                Filter
                                {(appliedFilters.roleIds.length > 0 ||
                                    appliedFilters.status) && (
                                        <Badge bg="primary" pill className="ms-2">
                                            {appliedFilters.roleIds.length +
                                                (appliedFilters.status ? 1 : 0)}
                                        </Badge>
                                    )}
                            </Button>

                            {/* Columns */}
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

                            {/* Sort */}
                            <Dropdown>
                                <Dropdown.Toggle
                                    as={Button}
                                    variant="white"
                                    className="d-inline-flex align-items-center"
                                >
                                    Sort by : {sort}
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" className="p-3">
                                    {(['Newest', 'Oldest', 'Ascending', 'Descending'] as SortOption[]).map((s) => (
                                        <Dropdown.Item
                                            key={s}
                                            active={sort === s}
                                            onClick={() => setSort(s)}
                                        >
                                            {s}
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
                                            Loading...
                                        </td>
                                    </tr>
                                )}
                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.filter((c) => c.visible).length} className="text-center py-4">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                                {users.map((user) => {
                                    const isAdminUser = user.role === 'Admin / Owner';

                                    return (
                                        <tr key={user.id}>
                                            {columns.find((c) => c.key === 'name')?.visible && (
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <a
                                                            href="#"
                                                            className="avatar avatar-sm avatar-rounded flex-shrink-0 me-2"
                                                        >
                                                            <img
                                                                src={getAssetUrl(user.avatarPath) ?? localImages[users.findIndex((u) => u.id === user.id) % localImages.length]}
                                                                alt={user.fullName}
                                                                className="img-fluid"
                                                                onError={(e) => {
                                                                    const idx = users.findIndex((u) => u.id === user.id);
                                                                    (e.target as HTMLImageElement).src = localImages[idx % localImages.length];
                                                                }}
                                                            />
                                                        </a>
                                                        <h6 className="fs-14 fw-normal mb-0">
                                                            <a href="#">{user.fullName}</a>
                                                        </h6>
                                                    </div>
                                                </td>
                                            )}
                                            {columns.find((c) => c.key === 'role')?.visible && (
                                                <td>{user.role}</td>
                                            )}
                                            {columns.find((c) => c.key === 'phone')?.visible && (
                                                <td>
                                                    <p className="text-dark mb-0">{user.phoneNumber}</p>
                                                </td>
                                            )}
                                            {columns.find((c) => c.key === 'status')?.visible && (
                                                <td>
                                                    <Badge
                                                        bg=""
                                                        className={
                                                            user.status === 'active'
                                                                ? 'badge-soft-success'
                                                                : 'badge-soft-danger'
                                                        }
                                                    >
                                                        {user.status === "active" ? "Active" : "Inactive"}
                                                    </Badge>
                                                </td>
                                            )}
                                            {columns.find((c) => c.key === 'actions')?.visible && (
                                                <td>
                                                    <Button
                                                        variant="white"
                                                        size="sm"
                                                        className="btn-icon rounded-circle me-2"
                                                        onClick={() => openDetail(user)}
                                                        title="View Details"
                                                    >
                                                        <Icon name="eye" />
                                                    </Button>
                                                    <Button
                                                        variant="white"
                                                        size="sm"
                                                        className="btn-icon rounded-circle me-2"
                                                        disabled={isAdminUser}
                                                        onClick={() => openPermission(user)}
                                                        title="Permissions"
                                                    >
                                                        <Icon name="shield" />
                                                    </Button>
                                                    <Button
                                                        variant="white"
                                                        size="sm"
                                                        className="btn-icon rounded-circle me-2"
                                                        disabled={isAdminUser}
                                                        onClick={() => openEdit(user)}
                                                        title="Edit"
                                                    >
                                                        <Icon name="pencil-line" />
                                                    </Button>
                                                    <Button
                                                        variant="white"
                                                        size="sm"
                                                        className="btn-icon rounded-circle"
                                                        disabled={isAdminUser}
                                                        onClick={() => openDelete(user)}
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
                    <Pagination totalItems={totalItems} currentPage={currentPage} onPageChange={handlePageChange} pageSize={PAGE_SIZE} />
                </Card.Body>
            </Card>

            {/* ================================================================ */}
            {/*  MODALS                                                          */}
            {/* ================================================================ */}

            {/* ---- Add User Modal ---- */}
            <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Add New User</h4>
                </Modal.Header>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAdd();
                    }}
                >
                    <Modal.Body className="p-4 pt-1">
                        {/* Avatar Upload */}
                        <div className="d-flex align-items-center gap-3 flex-wrap mb-4">
                            <div className="avatar avatar-3xl border bg-light d-flex align-items-center justify-content-center overflow-hidden">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Preview" className="img-fluid w-100 h-100 object-fit-cover" />
                                ) : (
                                    <Icon name="images" className="fs-28 text-dark" />
                                )}
                            </div>
                            <div>
                                <Form.Label>
                                    User Image
                                </Form.Label>
                                <p className="fs-13 mb-3">Image should be within 5 MB</p>
                                <div className="d-flex align-items-center">
                                    <div className="btn btn-icon btn-sm btn-white rounded-circle position-relative me-2">
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            className="position-absolute w-100 h-100 top-0 start-0 opacity-0"
                                            onChange={(e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0];
                                                if (file) {
                                                    handleAvatarChange(file, URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                        <Icon name="upload" />
                                    </div>
                                    {avatarPreview && (
                                        <Button
                                            variant="white"
                                            size="sm"
                                            className="btn-icon rounded-circle text-danger"
                                            onClick={clearAvatar}
                                        >
                                            <Icon name="trash-2" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="row align-items-center justify-content-center">
                            <div className="col-lg-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        First Name<span className="text-danger"> *</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={addForm.firstName}
                                        onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))}
                                        required
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-lg-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Last Name<span className="text-danger"> *</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={addForm.lastName}
                                        onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))}
                                        required
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Email<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="email"
                                value={addForm.email}
                                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Phone Number<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={addForm.phoneNumber}
                                onChange={(e) => setAddForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Role<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Select
                                value={addForm.roleId}
                                onChange={(e) => setAddForm((p) => ({ ...p, roleId: Number(e.target.value) }))}
                                required
                            >
                                <option value={0}>Select</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Password<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="password"
                                value={addForm.password}
                                onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                                required
                                minLength={8}
                            />
                        </Form.Group>                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Confirm Password<span className="text-danger"> *</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={addForm.confirmPassword}
                                        onChange={(e) => setAddForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                        required
                                        minLength={8}
                                        isInvalid={addForm.confirmPassword !== '' && addForm.password !== addForm.confirmPassword}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Passwords do not match
                                    </Form.Control.Feedback>
                                </Form.Group>

                        <div className="d-flex align-items-center justify-content-end gap-2 pt-1">
                            <Button variant="light" onClick={() => setShowAdd(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* ---- Edit User Modal ---- */}
            <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Edit User</h4>
                </Modal.Header>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleEdit();
                    }}
                >
                    <Modal.Body className="p-4 pt-1">
                        {/* Avatar Upload */}
                        <div className="d-flex align-items-center gap-3 flex-wrap mb-4">
                            <div className="avatar avatar-3xl border bg-light d-flex align-items-center justify-content-center overflow-hidden">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Preview" className="img-fluid w-100 h-100 object-fit-cover" />
                                ) : currentUser?.avatarPath ? (
                                    <img
                                        src={getAssetUrl(currentUser.avatarPath)}
                                        alt={currentUser.fullName}
                                        className="img-fluid w-100 h-100 object-fit-cover"
                                    />
                                ) : (
                                    <Icon name="images" className="fs-28 text-dark" />
                                )}
                            </div>
                            <div>
                                <Form.Label>
                                    User Image
                                </Form.Label>
                                <p className="fs-13 mb-3">Image should be within 5 MB</p>
                                <div className="d-flex align-items-center">
                                    <div className="btn btn-icon btn-sm btn-white rounded-circle position-relative me-2">
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            className="position-absolute w-100 h-100 top-0 start-0 opacity-0"
                                            onChange={(e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0];
                                                if (file) {
                                                    handleAvatarChange(file, URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                        <Icon name="upload" />
                                    </div>
                                    {avatarPreview && (
                                        <Button
                                            variant="white"
                                            size="sm"
                                            className="btn-icon rounded-circle text-danger"
                                            onClick={clearAvatar}
                                        >
                                            <Icon name="trash-2" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="row align-items-center justify-content-center">
                            <div className="col-lg-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        First Name<span className="text-danger"> *</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editForm.firstName}
                                        onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                                        required
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-lg-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Last Name<span className="text-danger"> *</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editForm.lastName}
                                        onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                                        required
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Email<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Phone Number<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={editForm.phoneNumber}
                                onChange={(e) => setEditForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Role<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Select
                                value={editForm.roleId}
                                onChange={(e) => setEditForm((p) => ({ ...p, roleId: Number(e.target.value) }))}
                                required
                            >
                                <option value={0}>Select</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Status<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Select
                                value={editForm.status}
                                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as Status }))}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                New Password <small className="text-muted">(leave blank to keep current)</small>
                            </Form.Label>
                            <Form.Control
                                type="password"
                                value={editForm.password}
                                onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                                minLength={8}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Confirm Password
                            </Form.Label>
                            <Form.Control
                                type="password"
                                value={editForm.confirmPassword}
                                onChange={(e) => setEditForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                minLength={8}
                                isInvalid={editForm.confirmPassword !== '' && editForm.password !== editForm.confirmPassword}
                            />
                            <Form.Control.Feedback type="invalid">
                                Passwords do not match
                            </Form.Control.Feedback>
                        </Form.Group>

                        <div className="d-flex align-items-center justify-content-end gap-2 pt-1">
                            <Button variant="light" onClick={() => setShowEdit(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                Save
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* ---- User Detail Modal ---- */}
            <Modal show={showDetail} onHide={() => setShowDetail(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">User Details</h4>
                </Modal.Header>
                {currentUser && (
                    <Modal.Body className="p-4 pt-1">
                        <div className="d-flex align-items-center gap-4 mb-4">
                            <div className="avatar avatar-4xl border bg-light d-flex align-items-center justify-content-center overflow-hidden rounded-circle">
                                {currentUser.avatarPath ? (
                                    <img
                                        src={getAssetUrl(currentUser.avatarPath)}
                                        alt={currentUser.fullName}
                                        className="img-fluid w-100 h-100 object-fit-cover"
                                    />
                                ) : (
                                    <Icon name="user" className="fs-32 text-dark" />
                                )}
                            </div>
                            <div>
                                <h5 className="fw-bold mb-1">{currentUser.fullName}</h5>
                                <p className="text-muted mb-1">{currentUser.email}</p>
                                <Badge
                                    bg=""
                                    className={currentUser.status === 'active' ? 'badge-soft-success' : 'badge-soft-danger'}
                                >
                                    {currentUser.status === 'active' ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="p-3 rounded-3 bg-light">
                                    <small className="text-muted d-block mb-1">First Name</small>
                                    <span className="fw-medium">{currentUser.firstName}</span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 rounded-3 bg-light">
                                    <small className="text-muted d-block mb-1">Last Name</small>
                                    <span className="fw-medium">{currentUser.lastName}</span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 rounded-3 bg-light">
                                    <small className="text-muted d-block mb-1">Phone Number</small>
                                    <span className="fw-medium">{currentUser.phoneNumber}</span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 rounded-3 bg-light">
                                    <small className="text-muted d-block mb-1">Role</small>
                                    <span className="fw-medium">{currentUser.role}</span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 rounded-3 bg-light">
                                    <small className="text-muted d-block mb-1">Email</small>
                                    <span className="fw-medium">{currentUser.email}</span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 rounded-3 bg-light">
                                    <small className="text-muted d-block mb-1">Status</small>
                                    <span className="fw-medium">
                                        <Badge
                                            bg=""
                                            className={currentUser.status === 'active' ? 'badge-soft-success' : 'badge-soft-danger'}
                                        >
                                            {currentUser.status === 'active' ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 rounded-3 bg-light">
                                    <small className="text-muted d-block mb-1">Created At</small>
                                    <span className="fw-medium">
                                        {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 rounded-3 bg-light">
                                    <small className="text-muted d-block mb-1">Last Updated</small>
                                    <span className="fw-medium">
                                        {new Date(currentUser.updatedAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="light" onClick={() => setShowDetail(false)}>
                                Close
                            </Button>
                        </div>
                    </Modal.Body>
                )}
            </Modal>

            {/* ---- Permissions Modal ---- */}
            <Modal show={showPermission} onHide={() => setShowPermission(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Permissions {currentUser && `- ${currentUser.fullName}`}</h4>
                </Modal.Header>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSavePermissions();
                    }}
                >
                    <Modal.Body className="p-4 pt-1">
                        <div className="table-responsive mb-3">
                            {loadingPerms ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Loading permissions...
                                </div>
                            ) : (
                                <Table className="m-0 table-nowrap bg-white border">
                                    <thead>
                                        <tr>
                                            <th>Module</th>
                                            <th>View</th>
                                            <th>Add</th>
                                            <th>Edit</th>
                                            <th>Delete</th>
                                            <th>Export</th>
                                            <th>Approved/Void</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {permissions.map((mod, idx) => (
                                            <tr key={mod.module}>
                                                <td className="text-dark fw-medium">{mod.module}</td>
                                                {(
                                                    [
                                                        'view',
                                                        'add',
                                                        'edit',
                                                        'delete_',
                                                        'export_',
                                                        'approvedVoid',
                                                    ] as (keyof Omit<PermissionModule, 'module'>)[]
                                                ).map((field) => (
                                                    <td key={field}>
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={Boolean(mod[field])}
                                                            onChange={() => togglePermission(idx, field)}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </div>
                        <div className="d-flex align-items-center justify-content-end gap-2 pt-1">
                            <Button variant="light" onClick={() => setShowPermission(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={savingPerms || loadingPerms}>
                                {savingPerms ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-1" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Permission'
                                )}
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* ---- Add User Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showAddApproval}
                onHide={() => setShowAddApproval(false)}
                actionLabel="create user"
                requestType="USER_CREATE_DELETE"
                description={`Create user ${addForm.firstName.trim()} ${addForm.lastName.trim()}`.trim()}
                targetType="USER"
                targetDisplay={addForm.email || undefined}
                additionalData={
                    addForm.firstName.trim() || addForm.lastName.trim() || addForm.email.trim()
                        ? JSON.stringify({
                              action: 'CREATE_USER',
                              userRequest: {
                                  firstName: addForm.firstName,
                                  lastName: addForm.lastName,
                                  email: addForm.email,
                                  phoneNumber: addForm.phoneNumber,
                                  password: addForm.password,
                                  role: addForm.roleId,
                              },
                          })
                        : null
                }
                onSent={() => {
                    setShowAddApproval(false);
                    setAddForm(addEmptyForm);
                    clearAvatar();
                    showToast('info', 'Create user request sent.');
                }}
            />

            {/* ---- Delete User Confirmation (admins delete directly) ---- */}
            <ConfirmModal
                show={showDeleteConfirm}
                handleClose={() => setShowDeleteConfirm(false)}
                type="delete"
                action={handleDeleteConfirm}
                data={currentUser?.fullName ?? ''}
                actionDisabled={deleting}
            />

            {/* ---- Delete User Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showDeleteApproval}
                onHide={() => setShowDeleteApproval(false)}
                actionLabel="delete user"
                requestType="USER_CREATE_DELETE"
                description={`Delete user ${currentUser?.fullName ?? ''}`}
                targetType="USER"
                targetId={currentUser?.id}
                targetDisplay={currentUser?.fullName}
                additionalData={
                    currentUser ? JSON.stringify({ action: 'DELETE_USER', userId: currentUser.id }) : null
                }
                onSent={() => {
                    setShowDeleteApproval(false);
                    setCurrentUser(null);
                    showToast('info', 'Delete user request sent.');
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
                            <Form.Label>Role</Form.Label>
                            <Dropdown autoClose="outside">
                                <Dropdown.Toggle
                                    as={Button}
                                    variant="white"
                                    className="d-flex align-items-center justify-content-between w-100"
                                >
                                    {draftRoles.length > 0 ? `${draftRoles.length} selected` : 'Select'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="p-3 w-100">
                                    <h6 className="fs-14 fw-semibold mb-3">Role</h6>
                                    <InputGroup className="mb-3 position-relative">
                                        <Form.Control
                                            type="text"
                                            placeholder="Search"
                                            value={filterRoleSearch}
                                            onChange={(e) => setFilterRoleSearch(e.target.value)}
                                        />
                                        <InputGroup.Text>
                                            <Icon name="search" className="text-dark" />
                                        </InputGroup.Text>
                                    </InputGroup>
                                    <div className="vstack gap-2">
                                        {filteredRoleOptions.map((r) => (
                                            <Form.Check
                                                key={r.id}
                                                type="checkbox"
                                                label={r.name}
                                                id={`filter-role-${r.id}`}
                                                checked={draftRoles.includes(r.id)}
                                                onChange={() => toggleDraftRole(r.id)}
                                            />
                                        ))}
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                value={draftStatus}
                                onChange={(e) => setDraftStatus(e.target.value)}
                            >
                                <option value="">Select</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Form.Group>
                    </div>

                    <div className="d-flex align-items-center gap-2 mt-auto border-0 pt-3">
                        <Button variant="light" className="w-100" onClick={handleResetFilter}>
                            Reset
                        </Button>
                        <Button variant="primary" className="w-100" onClick={handleApplyFilter}>
                            Apply
                        </Button>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default UsersPage;