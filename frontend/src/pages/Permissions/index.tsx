import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Table,
    Card,
    Button,
    Modal,
    Form,
    Nav,
} from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import Icon from '@/components/common/Icon';
import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';
import type { PermissionModule } from '@/types';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface RoleEntry {
    id: number;
    name: string;
}

/** Permission actions available per module */
type PermissionAction = 'view' | 'add' | 'edit' | 'delete_' | 'export_' | 'approvedVoid';

const allActions: PermissionAction[] = [
    'view',
    'add',
    'edit',
    'delete_',
    'export_',
    'approvedVoid',
];

const actionLabels: Record<PermissionAction, string> = {
    view: 'View',
    add: 'Add',
    edit: 'Edit',
    delete_: 'Delete',
    export_: 'Export',
    approvedVoid: 'Approved/Void',
};

/** Default modules shown in the permission table */
const defaultModules: PermissionModule[] = [
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

/** Deep-clone default modules so each role gets an independent copy */
const cloneModules = () => defaultModules.map((m) => ({ ...m }));

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
const PermissionsPage = () => {
    /* ---------- state ---------- */
    const [roles, setRoles] = useState<RoleEntry[]>([]);
    const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
    const [permissionsMap, setPermissionsMap] = useState<Record<number, PermissionModule[]>>({});

    // Add Role modal
    const [showAddRole, setShowAddRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    /* ---------- fetch roles ---------- */
    const loadRoles = useCallback(async () => {
        try {
            const { data } = await api.get<ApiResponse<RoleEntry[]>>('/roles');
            const fetched = data.result;
            setRoles(fetched);

            // Initialise permissions for each role if not already set
            setPermissionsMap((prev) => {
                const next = { ...prev };
                for (const role of fetched) {
                    if (!next[role.id]) {
                        next[role.id] = cloneModules();
                    }
                }
                return next;
            });
        } catch {
            console.error('Failed to load roles');
        }
    }, []);

    useEffect(() => {
        loadRoles();
    }, [loadRoles]);

    // Default to first role when roles first load
    useEffect(() => {
        if (roles.length > 0 && activeRoleId == null) {
            setActiveRoleId(roles[0].id);
        }
    }, [roles, activeRoleId]);

    /* ---------- active role ---------- */
    const activeRoleName = useMemo(
        () => roles.find((r) => r.id === activeRoleId)?.name ?? '',
        [roles, activeRoleId],
    );

    const activePermissions = activeRoleId ? permissionsMap[activeRoleId] ?? cloneModules() : [];

    /* ---------- toggle a single permission checkbox ---------- */
    const togglePermission = (moduleIdx: number, action: PermissionAction) => {
        if (activeRoleId == null) return;
        setPermissionsMap((prev) => {
            const perms = [...(prev[activeRoleId] ?? cloneModules())];
            perms[moduleIdx] = { ...perms[moduleIdx], [action]: !perms[moduleIdx][action] };
            return { ...prev, [activeRoleId]: perms };
        });
    };

    /* ---------- revert all (uncheck all) for this role ---------- */
    const handleRevertAll = () => {
        if (activeRoleId == null) return;
        setPermissionsMap((prev) => ({
            ...prev,
            [activeRoleId]: cloneModules(),
        }));
    };

    /* ---------- save changes ---------- */
    const handleSave = () => {
        // TODO: persist to backend when the API is available
        console.log('Saving permissions for role', activeRoleName, activePermissions);
    };

    /* ---------- add role ---------- */
    const handleAddRole = () => {
        if (!newRoleName.trim()) return;
        // Optimistically add a temporary role (API integration later)
        const tempId = Date.now();
        const newRole: RoleEntry = { id: tempId, name: newRoleName.trim() };
        setRoles((prev) => [...prev, newRole]);
        setPermissionsMap((prev) => ({ ...prev, [tempId]: cloneModules() }));
        setActiveRoleId(tempId);
        setNewRoleName('');
        setShowAddRole(false);
    };

    /* ---------- render ---------- */
    return (
        <>
            {/* ---- Page Header ---- */}
            <PageHeader
                title="Permissions"
                onRefresh={loadRoles}
                action={
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <Button
                            variant="primary"
                            className="d-inline-flex align-items-center"
                            onClick={() => setShowAddRole(true)}
                        >
                            <Icon name="circle-plus" className="me-1" />
                            Add New
                        </Button>
                    </div>
                }
            />

            {/* ---- Main Content ---- */}
            <div className="row justify-content-center">
                {/* Left Column — Roles List */}
                <div className="col-lg-4">
                    <Card>
                        <Card.Body>
                            <h6 className="fs-20 fw-bold mb-4">Roles</h6>
                            <div className="roles-sidebar d-flex align-items-start">
                                <Nav
                                    variant="pills"
                                    className="flex-column me-3 w-100"
                                    activeKey={activeRoleId ?? undefined}
                                    onSelect={(k) => setActiveRoleId(k ? Number(k) : null)}
                                >
                                    {roles.map((role) => (
                                        <Nav.Item key={role.id}>
                                            <Nav.Link eventKey={role.id} className="text-start">
                                                {role.name}
                                            </Nav.Link>
                                        </Nav.Item>
                                    ))}
                                    {roles.length === 0 && (
                                        <p className="text-muted fs-13 mb-0">No roles available</p>
                                    )}
                                </Nav>
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                {/* Right Column — Permission Table */}
                <div className="col-lg-8">
                    {activeRoleId != null ? (
                        <div>
                            {/* Role Header */}
                            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-4">
                                <div className="flex-grow-1">
                                    <h5 className="fs-16 fw-bold mb-0">
                                        Role : {activeRoleName}
                                    </h5>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <Form.Check
                                        type="checkbox"
                                        id="select-all"
                                        label="Revert All"
                                        checked={activePermissions.every((m) =>
                                            allActions.every((a) => !m[a])
                                        )}
                                        onChange={handleRevertAll}
                                    />
                                </div>
                            </div>

                            {/* Permission Card */}
                            <Card>
                                <Card.Body>
                                    <div className="table-responsive">
                                        <Table className="m-0 table-nowrap bg-white border">
                                            <thead>
                                                <tr>
                                                    <th>Module</th>
                                                    {allActions.map((action) => (
                                                        <th key={action}>{actionLabels[action]}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activePermissions.map((mod, idx) => (
                                                    <tr key={mod.module}>
                                                        <td className="text-dark fw-medium">
                                                            {mod.module}
                                                        </td>
                                                        {allActions.map((action) => (
                                                            <td key={action}>
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    checked={Boolean(mod[action])}
                                                                    onChange={() =>
                                                                        togglePermission(idx, action)
                                                                    }
                                                                />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="d-flex align-items-center justify-content-end flex-wrap row-gap-2 border-top mt-4 pt-4">
                                        <Button
                                            variant="light"
                                            className="me-2"
                                            onClick={handleRevertAll}
                                        >
                                            Cancel
                                        </Button>
                                        <Button variant="primary" onClick={handleSave}>
                                            Save Changes
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    ) : (
                        <Card>
                            <Card.Body className="text-center py-5">
                                <Icon name="shield" className="fs-1 text-muted mb-3" />
                                <p className="mb-0">Select a role to manage permissions</p>
                            </Card.Body>
                        </Card>
                    )}
                </div>
            </div>

            {/* ================================================================ */}
            {/*  MODALS                                                          */}
            {/* ================================================================ */}

            {/* ---- Add Role Modal ---- */}
            <Modal
                show={showAddRole}
                onHide={() => setShowAddRole(false)}
                centered
            >
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Add Role</h4>
                </Modal.Header>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAddRole();
                    }}
                >
                    <Modal.Body className="p-4 pt-1">
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Role Name<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter role name"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                            <Button
                                variant="light"
                                className="w-100"
                                onClick={() => setShowAddRole(false)}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" className="w-100" type="submit">
                                Save
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>
        </>
    );
};

export default PermissionsPage;
