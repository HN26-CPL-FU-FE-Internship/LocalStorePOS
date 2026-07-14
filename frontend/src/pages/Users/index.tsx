import { useEffect, useMemo, useState } from 'react';
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
import { getUsers } from '@/api/user.api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type Status = "Active" | "Inactive";
export interface UserEntry {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    phone: string;
    email: string;
    status: Status
    avatarKey: string; // key into userImages
}

export interface PermissionModule {
    module: string;
    view: boolean;
    add: boolean;
    edit: boolean;
    delete_: boolean;
    export_: boolean;
    approvedVoid: boolean;
}

/* ------------------------------------------------------------------ */
/*  Static demo data                                                  */
/* ------------------------------------------------------------------ */
const userRoles = [
    'Admin / Owner',
    'Supervisor',
    'Cashier',
    'Chef',
    'Waiter',
    'Delivery',
    'Accountant',
    'System Operator',
] as const;

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
    userIds: string[];
    roles: string[];
    status: string; // '' | 'Active' | 'Inactive'
}

const emptyAppliedFilters: AppliedFilters = { userIds: [], roles: [], status: '' };

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
const UsersPage = () => {
    /* ---------- state ---------- */
    const [users, setUsers] = useState<UserEntry[]>([]);
    const [columns, setColumns] = useState<ColumnOption[]>(defaultColumns);

    // Modals
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showPermission, setShowPermission] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [sort, setSort] = useState("Newest");
    // Current user being edited / deleted / permissioned
    const [currentUser, setCurrentUser] = useState<UserEntry | null>(null);
    const [permissions, setPermissions] = useState<PermissionModule[]>(defaultPermissionModules);

    // Add / Edit form state
    const emptyForm = { firstName: '', lastName: '', email: '', phone: '', role: '', status: 'Active' };
    const [form, setForm] = useState<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        role: string;
        status: string;
    }>(emptyForm);

    /* ---------- live search state ---------- */
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim().toLowerCase());
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    /* ---------- filter state ---------- */
    // draft state edited inside the offcanvas
    const [draftUserIds, setDraftUserIds] = useState<string[]>([]);
    const [draftRoles, setDraftRoles] = useState<string[]>([]);
    const [draftStatus, setDraftStatus] = useState('');
    // filters actually applied to the table
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(emptyAppliedFilters);
    const [filterNameSearch, setFilterNameSearch] = useState('');
    const [filterRoleSearch, setFilterRoleSearch] = useState('');

    /* ---------- helpers ---------- */
    const toggleColumn = (key: string) =>
        setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));

    const resetForm = () => setForm(emptyForm);

    const handleAdd = () => {
        const id = `u${Date.now()}`;
        const newUser: UserEntry = {
            id,
            firstName: form.firstName,
            lastName: form.lastName,
            fullName: `${form.firstName} ${form.lastName}`,
            role: form.role,
            phone: form.phone,
            email: form.email,
            status: form.status as UserEntry['status'],
            avatarKey: 'user-01',
        };
        setUsers((prev) => [...prev, newUser]);
        resetForm();
        setShowAdd(false);
    };

    const handleEdit = () => {
        if (!currentUser) return;
        setUsers((prev) =>
            prev.map((u) =>
                u.id === currentUser.id
                    ? {
                        ...u,
                        firstName: form.firstName,
                        lastName: form.lastName,
                        fullName: `${form.firstName} ${form.lastName}`,
                        role: form.role,
                        phone: form.phone,
                        email: form.email,
                        status: form.status as UserEntry['status'],
                    }
                    : u,
            ),
        );
        resetForm();
        setCurrentUser(null);
        setShowEdit(false);
    };

    const openEdit = (user: UserEntry) => {
        setCurrentUser(user);
        setForm({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status as Status,
        });
        setShowEdit(true);
    };

    const handleDelete = () => {
        if (!currentUser) return;
        setUsers((prev) => prev.filter((u) => u.id !== currentUser.id));
        setCurrentUser(null);
        setShowDelete(false);
    };

    const openDelete = (user: UserEntry) => {
        setCurrentUser(user);
        setShowDelete(true);
    };

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
    const loadUsers = async () => {
        const result = await getUsers();
        setUsers(result);
    };
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadUsers();
    }, []);

    /* ---------- filter offcanvas helpers ---------- */
    const openFilter = () => {
        // sync draft with currently applied filters whenever the panel opens
        setDraftUserIds(appliedFilters.userIds);
        setDraftRoles(appliedFilters.roles);
        setDraftStatus(appliedFilters.status);
        setShowFilter(true);
    };

    const toggleDraftUserId = (id: string) => {
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

    const filteredRoleOptions = useMemo(
        () =>
            userRoles.filter((r) =>
                r.toLowerCase().includes(filterRoleSearch.trim().toLowerCase()),
            ),
        [filterRoleSearch],
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
                const haystack = [u.fullName, u.role, u.phone, u.status, u.email]
                    .join(' ')
                    .toLowerCase();
                return terms.every((term) => haystack.includes(term));
            });
        }

        return result;
    }, [users, appliedFilters, searchTerm]);

    /* ---------- export helpers ---------- */
    const exportRows = (list: UserEntry[]) =>
        list.map((u) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            fullName: u.fullName,
            role: u.role,
            phone: u.phone,
            email: u.email,
            status: u.status,
        }));

    const handleExportExcel = () => {
        const rows = exportRows(filteredUsers);
        const worksheet = XLSX.utils.json_to_sheet(rows, {
            header: ['id', 'firstName', 'lastName', 'fullName', 'role', 'phone', 'email', 'status'],
        });
        XLSX.utils.sheet_add_aoa(
            worksheet,
            [['ID', 'First Name', 'Last Name', 'Full Name', 'Role', 'Phone', 'Email', 'Status']],
            { origin: 'A1' },
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
        XLSX.writeFile(workbook, `users_${Date.now()}.xlsx`);
    };

    const handleExportPDF = () => {
        const rows = exportRows(filteredUsers);
        const doc = new jsPDF();
        doc.text('Users', 14, 12);
        autoTable(doc, {
            startY: 18,
            head: [['ID', 'First Name', 'Last Name', 'Full Name', 'Role', 'Phone', 'Email', 'Status']],
            body: rows.map((r) => [r.id, r.firstName, r.lastName, r.fullName, r.role, r.phone, r.email, r.status]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [33, 37, 41] },
        });
        doc.save(`users_${Date.now()}.pdf`);
    };

    /* ---------- render ---------- */
    return (
        <>
            {/* ---- Page Header ---- */}
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-3 mb-4">
                <div className="flex-grow-1">
                    <h3 className="mb-0">
                        Users
                        <Button
                            variant="white"
                            size="sm"
                            className="btn-icon rounded-circle ms-2"
                            aria-label="refresh"
                            onClick={loadUsers}
                        >
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
                <div className="gap-2 d-flex align-items-center flex-wrap">
                    <Dropdown>
                        <Dropdown.Toggle
                            as={Button}
                            variant="white"
                            className="d-inline-flex align-items-center"
                        >
                            <Icon name="upload" className="me-1" />
                            Export
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end" className="p-3">
                            <Dropdown.Item className="rounded" onClick={handleExportPDF}>
                                Export as PDF
                            </Dropdown.Item>
                            <Dropdown.Item className="rounded" onClick={handleExportExcel}>
                                Export as Excel
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <Button
                        variant="primary"
                        className="d-inline-flex align-items-center"
                        onClick={() => {
                            resetForm();
                            setShowAdd(true);
                        }}
                    >
                        <Icon name="circle-plus" className="me-1" />
                        Add New
                    </Button>
                </div>
            </div>

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
                                <Icon name="search" className='position-absolute top-50 end-0 translate-middle-y me-3 text-secondary' />
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
                                    {['Newest', 'Oldest', 'Ascending', 'Descending'].map((s) => (
                                        <Dropdown.Item key={s} onClick={() => setSort(s)}>
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
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.filter((c) => c.visible).length} className="text-center py-4">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                                {filteredUsers.map((user) => {
                                    const isAdmin = user.role === 'Admin / Owner';
                                    const avatarSrc = user.avatarKey;

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
                                                                src={avatarSrc}
                                                                alt={user.fullName}
                                                                className="img-fluid"
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
                                                    <p className="text-dark mb-0">{user.phone}</p>
                                                </td>
                                            )}
                                            {columns.find((c) => c.key === 'status')?.visible && (
                                                <td>
                                                    <Badge
                                                        bg=""
                                                        className={
                                                            user.status === 'Active'
                                                                ? 'badge-soft-success'
                                                                : 'badge-soft-danger'
                                                        }
                                                    >
                                                        {user.status}
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
                        <div className="d-flex align-items-center gap-3 flex-wrap mb-4">
                            <div className="avatar avatar-3xl border bg-light d-flex align-items-center justify-content-center">
                                <Icon name="images" className="fs-28 text-dark" />
                            </div>
                            <div>
                                <Form.Label>
                                    User Image<span className="text-danger"> *</span>
                                </Form.Label>
                                <p className="fs-13 mb-3">Image should be within 5 MB</p>
                                <div className="d-flex align-items-center">
                                    <div className="btn btn-icon btn-sm btn-white rounded-circle position-relative me-2">
                                        <Form.Control
                                            type="file"
                                            className="position-absolute w-100 h-100 top-0 start-0 opacity-0"
                                        />
                                        <Icon name="upload" />
                                    </div>
                                    <Button variant="white" size="sm" className="btn-icon rounded-circle text-danger">
                                        <Icon name="trash-2" />
                                    </Button>
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
                                        value={form.firstName}
                                        onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
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
                                        value={form.lastName}
                                        onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
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
                                value={form.email}
                                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Phone Number<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={form.phone}
                                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Role<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Select
                                value={form.role}
                                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                                required
                            >
                                <option value="">Select</option>
                                {userRoles.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Password<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control type="password" required />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Confirm Password<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control type="password" required />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Status<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Select
                                value={form.status}
                                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Status }))}
                            >
                                <option>Select</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </Form.Select>
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
                        <div className="d-flex align-items-center gap-3 flex-wrap mb-4">
                            <div className="avatar avatar-3xl border bg-light d-flex align-items-center justify-content-center">
                                <Icon name="images" className="fs-28 text-dark" />
                            </div>
                            <div>
                                <Form.Label>
                                    User Image<span className="text-danger"> *</span>
                                </Form.Label>
                                <p className="fs-13 mb-3">Image should be within 5 MB</p>
                                <div className="d-flex align-items-center">
                                    <div className="btn btn-icon btn-sm btn-white rounded-circle position-relative me-2">
                                        <Form.Control
                                            type="file"
                                            className="position-absolute w-100 h-100 top-0 start-0 opacity-0"
                                        />
                                        <Icon name="upload" />
                                    </div>
                                    <Button variant="white" size="sm" className="btn-icon rounded-circle text-danger">
                                        <Icon name="trash-2" />
                                    </Button>
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
                                        value={form.firstName}
                                        onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
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
                                        value={form.lastName}
                                        onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
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
                                value={form.email}
                                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Phone Number<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={form.phone}
                                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Role<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Select
                                value={form.role}
                                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                                required
                            >
                                <option value="">Select</option>
                                {userRoles.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Status<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Select
                                value={form.status}
                                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Status }))}
                            >
                                <option>Select</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </Form.Select>
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
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
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