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
} from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
} from '@/services/api/user.api';
import { type PermissionModule, type UserEntry, type Status } from '@/types';
import type { UserCreateRequest, UserUpdateRequest } from '@/types/user';
import PageHeader from '@/components/common/PageHeader';
import HeaderUsers from '@/components/headers/HeaderUsers';
import userImages from '@/assets/img/users';
import { api } from '@/lib/axios';
import Pagination from '@/components/common/Pagination';
import { useLocation } from 'react-router-dom';

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
    userIds: number[];
    roles: string[];
    status: string; // '' | 'Active' | 'Inactive'
}

const emptyAppliedFilters: AppliedFilters = { userIds: [], roles: [], status: '' };

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
    /* ---------- Pagination ---------- */
    const location = useLocation();
    const PAGE_SIZE = 10;
    const match = location.pathname.match(/\/pages\/(\d+)/);
    const currentPage = match ? Number(match[1]) : 1;
    /* ---------- state ---------- */
    const [users, setUsers] = useState<UserEntry[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [columns, setColumns] = useState<ColumnOption[]>(defaultColumns);
    const [loading, setLoading] = useState(false);

    // Modals
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showPermission, setShowPermission] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [sort, setSort] = useState<SortOption>('Newest');
    const [totalItems, setTotalItems] = useState<number>(0);

    // Current user being edited / deleted / permissioned
    const [currentUser, setCurrentUser] = useState<UserEntry | null>(null);
    const [permissions, setPermissions] = useState<PermissionModule[]>(defaultPermissionModules);

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

    /* ---------- live search state ---------- */
    // const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         setSearchTerm(searchInput.trim().toLowerCase());
    //     }, 300);
    //     return () => clearTimeout(timer);
    // }, [searchInput]);

    /* ---------- filter state ---------- */
    const [draftUserIds, setDraftUserIds] = useState<number[]>([]);
    const [draftRoles, setDraftRoles] = useState<string[]>([]);
    const [draftStatus, setDraftStatus] = useState('');
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(emptyAppliedFilters);
    const [filterNameSearch, setFilterNameSearch] = useState('');
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
            });
            setUsers(result.items);
            setTotalItems(result.totalElements)
        } catch {
            console.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [sort, currentPage]);

    /* ---------- fetch roles ---------- */
    const loadRoles = useCallback(async () => {
        try {
            const { data } = await api.get<RoleOption[]>('/roles');
            setRoles(data);
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

    /* ---------- add user ---------- */
    const handleAdd = async () => {
        if (addForm.password !== addForm.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        try {
            const request: UserCreateRequest = {
                firstName: addForm.firstName,
                lastName: addForm.lastName,
                email: addForm.email,
                phoneNumber: addForm.phoneNumber,
                password: addForm.password,
                role: addForm.roleId,
            };
            await createUser(request, avatarFile);
            setShowAdd(false);
            setAddForm(addEmptyForm);
            clearAvatar();
            await loadUsers();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to create user';
            alert(msg);
        }
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
            alert('Passwords do not match');
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to update user';
            alert(msg);
        }
    };

    /* ---------- delete user ---------- */
    const openDelete = (user: UserEntry) => {
        setCurrentUser(user);
        setShowDelete(true);
    };

    const handleDelete = async () => {
        if (!currentUser) return;
        try {
            await deleteUser(currentUser.id);
            setCurrentUser(null);
            setShowDelete(false);
            await loadUsers();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to delete user';
            alert(msg);
        }
    };

    /* ---------- permission ---------- */
    const openPermission = (user: UserEntry) => {
        setCurrentUser(user);
        setPermissions(defaultPermissionModules.map((m) => ({ ...m })));
        setShowPermission(true);
    };

    const togglePermission = (moduleIdx: number, field: keyof Omit<PermissionModule, 'module'>) => {
        setPermissions((prev) =>
            prev.map((m, i) => (i === moduleIdx ? { ...m, [field]: !m[field] } : m)),
        );
    };

    /* ---------- filter offcanvas helpers ---------- */
    const openFilter = () => {
        // sync draft with currently applied filters whenever the panel opens
        setDraftUserIds(appliedFilters.userIds);
        setDraftRoles(appliedFilters.roles);
        setDraftStatus(appliedFilters.status);
        setShowFilter(true);
    };

    const toggleDraftUserId = (id: number) => {
        setDraftUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleDraftRole = (role: string) => {
        setDraftRoles((prev) => (prev.includes(role) ? prev.filter((x) => x !== role) : [...prev, role]));
    };

    const handleApplyFilter = () => {
        setAppliedFilters({ userIds: draftUserIds, roles: draftRoles, status: draftStatus });
        setShowFilter(false);
    };

    const handleResetFilter = () => {
        setDraftUserIds([]);
        setDraftRoles([]);
        setDraftStatus('');
        setFilterNameSearch('');
        setFilterRoleSearch('');
        setAppliedFilters(emptyAppliedFilters);
    };

    const filteredNameOptions = useMemo(
        () =>
            users.filter((u) =>
                u.fullName.toLowerCase().includes(filterNameSearch.trim().toLowerCase()),
            ),
        [users, filterNameSearch],
    );

    const roleNames = useMemo(() => roles.map((r) => r.name), [roles]);

    const filteredRoleOptions = useMemo(
        () =>
            roleNames.filter((r) =>
                r.toLowerCase().includes(filterRoleSearch.trim().toLowerCase()),
            ),
        [roleNames, filterRoleSearch],
    );

    /* ---------- combined filtering + live search ---------- */
    const filteredUsers = useMemo(() => {
        let result = users;

        // modal filters
        if (appliedFilters.userIds.length) {
            result = result.filter((u) => appliedFilters.userIds.includes(u.id));
        }
        if (appliedFilters.roles.length) {
            result = result.filter((u) => appliedFilters.roles.includes(u.role));
        }
        if (appliedFilters.status) {
            result = result.filter((u) => u.status === appliedFilters.status);
        }

        // live search across every displayed field, multi-term (space separated), AND across terms
        if (searchTerm) {
            const terms = searchTerm.split(/\s+/).filter(Boolean);
            result = result.filter((u) => {
                const haystack = [u.fullName, u.role, u.phoneNumber, u.email]
                    .join(' ')
                    .toLowerCase();
                return terms.every((term) => haystack.includes(term));
            });
        }

        return result;
    }, [users, appliedFilters, searchTerm]);


    /* ---------- render ---------- */
    return (
        <>
            {/* ---- Page Header ---- */}
            <PageHeader
                title="User"
                onRefresh={loadUsers}
                action={HeaderUsers(filteredUsers, () => {
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
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                                {(appliedFilters.userIds.length > 0 ||
                                    appliedFilters.roles.length > 0 ||
                                    appliedFilters.status) && (
                                        <Badge bg="primary" pill className="ms-2">
                                            {appliedFilters.userIds.length +
                                                appliedFilters.roles.length +
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
                                {!loading && filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.filter((c) => c.visible).length} className="text-center py-4">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                                {filteredUsers.map((user) => {
                                    const isAdmin = user.role === 'Admin / Owner';

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
                                                                src={user.avatarPath ? `http://localhost:8080/restaurant-pos${user.avatarPath}` : localImages[users.findIndex((u) => u.id === user.id) % localImages.length]}
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
                                                        disabled={isAdmin}
                                                        onClick={() => openPermission(user)}
                                                        title="Permissions"
                                                    >
                                                        <Icon name="shield" />
                                                    </Button>
                                                    <Button
                                                        variant="white"
                                                        size="sm"
                                                        className="btn-icon rounded-circle me-2"
                                                        disabled={isAdmin}
                                                        onClick={() => openEdit(user)}
                                                        title="Edit"
                                                    >
                                                        <Icon name="pencil-line" />
                                                    </Button>
                                                    <Button
                                                        variant="white"
                                                        size="sm"
                                                        className="btn-icon rounded-circle"
                                                        disabled={isAdmin}
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
                    <Pagination totalItems={totalItems} pageSize={PAGE_SIZE} />
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
                        </Form.Group>

                        <Form.Group className="mb-3">
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
                            <Button variant="primary" type="submit">
                                Save
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
                                        src={`http://localhost:8080/restaurant-pos${currentUser.avatarPath}`}
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

            {/* ---- Permissions Modal ---- */}
            <Modal show={showPermission} onHide={() => setShowPermission(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Permissions {currentUser && `- ${currentUser.fullName}`}</h4>
                </Modal.Header>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setShowPermission(false);
                    }}
                >
                    <Modal.Body className="p-4 pt-1">
                        <div className="d-flex justify-content-end mb-3">
                            <Form.Check type="checkbox" id="select-all" label="Revert All" />
                        </div>
                        <div className="table-responsive mb-3">
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
                        </div>
                        <div className="d-flex align-items-center justify-content-end gap-2 pt-1">
                            <Button variant="light" onClick={() => setShowPermission(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                Save Permission
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* ---- Delete Confirmation Modal ---- */}
            <Modal show={showDelete} onHide={() => setShowDelete(false)} centered size="sm">
                <Modal.Body className="text-center p-4">
                    <div className="mb-4">
                        <span className="avatar avatar-xxl rounded-circle bg-danger-subtle d-inline-flex align-items-center justify-content-center">
                            <Icon name="trash-2" className="fs-2 text-danger" />
                        </span>
                    </div>
                    <h4 className="mb-1">Delete Confirmation</h4>
                    <p className="mb-4">Are you sure you want to delete{currentUser ? ` ${currentUser.fullName}?` : '?'}</p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="light" className="w-100" onClick={() => setShowDelete(false)}>
                            Close
                        </Button>
                        <Button variant="danger" className="w-100" onClick={handleDelete}>
                            Delete
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
                            <Form.Label>Name</Form.Label>
                            <Dropdown autoClose="outside">
                                <Dropdown.Toggle
                                    as={Button}
                                    variant="white"
                                    className="d-flex align-items-center justify-content-between w-100"
                                >
                                    {draftUserIds.length > 0 ? `${draftUserIds.length} selected` : 'Select'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="p-3 w-100">
                                    <h6 className="fs-14 fw-semibold mb-3">Name</h6>
                                    <InputGroup className="mb-3 position-relative">
                                        <Form.Control
                                            type="text"
                                            placeholder="Search"
                                            value={filterNameSearch}
                                            onChange={(e) => setFilterNameSearch(e.target.value)}
                                        />
                                        <InputGroup.Text>
                                            <Icon name="search" className="text-dark" />
                                        </InputGroup.Text>
                                    </InputGroup>
                                    <div className="vstack gap-2">
                                        {filteredNameOptions.map((u) => (
                                            <Form.Check
                                                key={u.id}
                                                type="checkbox"
                                                label={u.fullName}
                                                id={`filter-name-${u.id}`}
                                                checked={draftUserIds.includes(u.id)}
                                                onChange={() => toggleDraftUserId(u.id)}
                                            />
                                        ))}
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Form.Group>

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
                                                key={r}
                                                type="checkbox"
                                                label={r}
                                                id={`filter-role-${r}`}
                                                checked={draftRoles.includes(r)}
                                                onChange={() => toggleDraftRole(r)}
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