import { useEffect, useState } from 'react';
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
import Pagination from '@/components/common/Pagination';
import { getUsers } from '@/api/user.api';

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

// const initialUsers: UserEntry[] = [
//     { id: 'u1', firstName: 'John', lastName: 'Smith', fullName: 'John Smith', role: 'Admin / Owner', phone: '+1 23456 78901', email: 'john@example.com', status: 'Active', avatarKey: 'user-01' },
//     { id: 'u2', firstName: 'Emily', lastName: 'Johnson', fullName: 'Emily Johnson', role: 'Supervisor', phone: '+1 34567 89012', email: 'emily@example.com', status: 'Active', avatarKey: 'user-02' },
//     { id: 'u3', firstName: 'David', lastName: 'Williams', fullName: 'David Williams', role: 'Cashier', phone: '+1 45678 90123', email: 'david@example.com', status: 'Active', avatarKey: 'user-03' },
//     { id: 'u4', firstName: 'Ashley', lastName: 'Brown', fullName: 'Ashley Brown', role: 'Chef', phone: '+1 56789 01234', email: 'ashley@example.com', status: 'Active', avatarKey: 'user-04' },
//     { id: 'u5', firstName: 'Michael', lastName: 'Davis', fullName: 'Michael Davis', role: 'Waiter', phone: '+1 67890 12345', email: 'michael@example.com', status: 'Active', avatarKey: 'user-05' },
//     { id: 'u6', firstName: 'Brittany', lastName: 'Miller', fullName: 'Brittany Miller', role: 'Delivery', phone: '+1 78901 23456', email: 'brittany@example.com', status: 'Active', avatarKey: 'user-06' },
//     { id: 'u7', firstName: 'Christopher', lastName: 'Wilson', fullName: 'Christopher Wilson', role: 'Accountant', phone: '+1 89012 34567', email: 'chris@example.com', status: 'Active', avatarKey: 'user-07' },
//     { id: 'u8', firstName: 'Jessica', lastName: 'Moore', fullName: 'Jessica Moore', role: 'System Operator', phone: '+1 90123 45678', email: 'jessica@example.com', status: 'Active', avatarKey: 'user-08' },
//     { id: 'u9', firstName: 'Matthew', lastName: 'Taylor', fullName: 'Matthew Taylor', role: 'Chef', phone: '+1 01234 56789', email: 'matthew@example.com', status: 'Active', avatarKey: 'user-09' },
//     { id: 'u10', firstName: 'Sarah', lastName: 'Anderson', fullName: 'Sarah Anderson', role: 'Chef', phone: '+1 12345 67890', email: 'sarah@example.com', status: 'Active', avatarKey: 'user-10' },
// ];

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
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortDir, setSortDir] = useState("asc");
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
        const result = await getUsers({
            page: 1,
            size: 10,
            sortBy: sortBy,
            sortDir: sortDir
        });
        setUsers(result.items);
    };
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
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
                            <Dropdown.Item className="rounded" href="#">
                                Export as PDF
                            </Dropdown.Item>
                            <Dropdown.Item className="rounded" href="#">
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
                                <input className="form-control form-control-sm" placeholder="Search" aria-controls="DataTables_Table_0" type="text" />
                                <Icon name="search" className='position-absolute top-50 end-0 translate-middle-y me-3 text-secondary' />
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            {/* Filter */}
                            <Button
                                variant="white"
                                className="d-inline-flex align-items-center"
                                onClick={() => setShowFilter(true)}
                            >
                                <Icon name="funnel" className="me-2" />
                                Filter
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
                                    Sort by : Newest
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" className="p-3">
                                    <Dropdown.Item href="#">Newest</Dropdown.Item>
                                    <Dropdown.Item href="#">Oldest</Dropdown.Item>
                                    <Dropdown.Item href="#">Ascending</Dropdown.Item>
                                    <Dropdown.Item href="#">Descending</Dropdown.Item>
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
                                {users.map((user) => {
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
                    <Pagination totalItems={users.length} />
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
                            <Form.Label>
                                Name<span className="text-danger"> *</span>
                            </Form.Label>
                            <Dropdown autoClose="outside">
                                <Dropdown.Toggle
                                    as={Button}
                                    variant="white"
                                    className="d-flex align-items-center justify-content-between w-100"
                                >
                                    Select
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="p-3 w-100">
                                    <h6 className="fs-14 fw-semibold mb-3">Name</h6>
                                    <InputGroup className="mb-3 position-relative">
                                        <Form.Control type="text" placeholder="Search" />
                                        <InputGroup.Text>
                                            <Icon name="search" className="text-dark" />
                                        </InputGroup.Text>
                                    </InputGroup>
                                    <div className="vstack gap-2">
                                        {users.map((u) => (
                                            <Form.Check
                                                key={u.id}
                                                type="checkbox"
                                                label={u.fullName}
                                                id={`filter-name-${u.id}`}
                                            />
                                        ))}
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Role<span className="text-danger"> *</span>
                            </Form.Label>
                            <Dropdown autoClose="outside">
                                <Dropdown.Toggle
                                    as={Button}
                                    variant="white"
                                    className="d-flex align-items-center justify-content-between w-100"
                                >
                                    Select
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="p-3 w-100">
                                    <h6 className="fs-14 fw-semibold mb-3">Role</h6>
                                    <InputGroup className="mb-3 position-relative">
                                        <Form.Control type="text" placeholder="Search" />
                                        <InputGroup.Text>
                                            <Icon name="search" className="text-dark" />
                                        </InputGroup.Text>
                                    </InputGroup>
                                    <div className="vstack gap-2">
                                        {userRoles.map((r) => (
                                            <Form.Check
                                                key={r}
                                                type="checkbox"
                                                label={r}
                                                id={`filter-role-${r}`}
                                            />
                                        ))}
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Status<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Select>
                                <option>Select</option>
                                <option>Active</option>
                                <option>Inactive</option>
                            </Form.Select>
                        </Form.Group>
                    </div>

                    <div className="d-flex align-items-center gap-2 mt-auto border-0 pt-3">
                        <Button variant="light" className="w-100" onClick={() => setShowFilter(false)}>
                            Reset
                        </Button>
                        <Button variant="primary" className="w-100" onClick={() => setShowFilter(false)}>
                            Apply
                        </Button>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default UsersPage;
