import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Table, Card, Button, Modal, Form, Nav, Spinner, Alert } from 'react-bootstrap';
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
    isSystemRole: boolean;
}

interface RolePermissionsResponse {
    roleId: number;
    roleName: string;
    permissions: PermissionModule[];
}

/** Permission actions available per module */
type PermissionAction = 'view' | 'add' | 'edit' | 'delete_' | 'export_' | 'approvedVoid';

const allActions: PermissionAction[] = ['view', 'add', 'edit', 'delete_', 'export_', 'approvedVoid'];

const actionLabels: Record<PermissionAction, string> = {
    view: 'View',
    add: 'Add',
    edit: 'Edit',
    delete_: 'Delete',
    export_: 'Export',
    approvedVoid: 'Approved/Void',
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
const PermissionsPage = () => {
    /* ---------- state ---------- */
    const [roles, setRoles] = useState<RoleEntry[]>([]);
    const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
    const [permissionsMap, setPermissionsMap] = useState<Record<number, PermissionModule[]>>({});

    // Baseline snapshot of permissions as returned by the API
    const [baselineMap, setBaselineMap] = useState<Record<number, PermissionModule[]>>({});

    // Whether the active role's current permissions differ from baseline
    const isDirty = useMemo(() => {
        if (activeRoleId == null) return false;
        const current = permissionsMap[activeRoleId] ?? [];
        const baseline = baselineMap[activeRoleId] ?? [];
        if (current.length !== baseline.length) return true;
        return current.some((mod, i) => allActions.some((a) => Boolean(mod[a]) !== Boolean(baseline[i]?.[a])));
    }, [activeRoleId, permissionsMap, baselineMap]);

    // Loading & feedback
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [loadingPerms, setLoadingPerms] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

    // Reset to default
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);

    // Add Role modal
    const [showAddRole, setShowAddRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [addingRole, setAddingRole] = useState(false);

    // Track whether permissions have been loaded for the active role
    const loadedRolesRef = useRef<Set<number>>(new Set());
    // const prevActiveRoleRef = useRef<number | null>(null);

    /* ---------- helpers ---------- */
    const showFeedback = (type: 'success' | 'danger', message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 4000);
    };

    /* ---------- fetch roles ---------- */
    const loadRoles = useCallback(async () => {
        setLoadingRoles(true);
        try {
            const { data } = await api.get<ApiResponse<RoleEntry[]>>('/roles');
            const fetched = data.result;
            setRoles(fetched);

            // Pre-populate empty permissions for any new role
            setPermissionsMap((prev) => {
                const next = { ...prev };
                for (const role of fetched) {
                    if (!next[role.id]) {
                        next[role.id] = [];
                    }
                }
                return next;
            });

            // Auto-select first role if none selected
            if (fetched.length > 0 && activeRoleId == null) {
                setActiveRoleId(fetched[0].id);
            }
        } catch {
            showFeedback('danger', 'Failed to load roles');
        } finally {
            setLoadingRoles(false);
        }
    }, [activeRoleId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------- fetch permissions when active role changes ---------- */
    useEffect(() => {
        if (activeRoleId == null) return;

        // Avoid re-fetching if we already have the data from the API
        if (loadedRolesRef.current.has(activeRoleId)) {
            return;
        }

        const fetchPermissions = async () => {
            setLoadingPerms(true);
            try {
                const { data } = await api.get<ApiResponse<RolePermissionsResponse>>(
                    `/roles/${activeRoleId}/permissions`,
                );
                const perms = data.result.permissions;
                const permsClone = perms.map((m: PermissionModule) => ({ ...m }));
                setPermissionsMap((prev) => ({ ...prev, [activeRoleId]: permsClone }));
                setBaselineMap((prev) => ({
                    ...prev,
                    [activeRoleId]: permsClone,
                }));
                loadedRolesRef.current.add(activeRoleId);
            } catch {
                showFeedback('danger', 'Failed to load permissions');
            } finally {
                setLoadingPerms(false);
            }
        };

        fetchPermissions();
    }, [activeRoleId]);

    /* ---------- active role ---------- */
    const activeRole = useMemo(() => roles.find((r) => r.id === activeRoleId) ?? null, [roles, activeRoleId]);

    const activeRoleName = useMemo(() => activeRole?.name ?? '', [activeRole]);

    const activePermissions = useMemo(
        () => (activeRoleId ? (permissionsMap[activeRoleId] ?? []) : []),
        [activeRoleId, permissionsMap],
    );

    /* ---------- toggle a single permission checkbox ---------- */
    const togglePermission = (moduleIdx: number, action: PermissionAction) => {
        if (activeRoleId == null) return;
        setPermissionsMap((prev) => {
            const perms = [...(prev[activeRoleId] ?? [])];
            if (perms[moduleIdx]) {
                perms[moduleIdx] = { ...perms[moduleIdx], [action]: !perms[moduleIdx][action] };
            }
            return { ...prev, [activeRoleId]: perms };
        });
    };

    /* ---------- revert to baseline (original API data) ---------- */
    const handleRevertToBaseline = () => {
        if (activeRoleId == null) return;
        const baseline = baselineMap[activeRoleId];
        if (!baseline) return;
        setPermissionsMap((prev) => ({
            ...prev,
            [activeRoleId]: baseline.map((m) => ({ ...m })),
        }));
    };

    /* ---------- reset to default settings ---------- */
    const handleResetToDefault = async () => {
        if (activeRoleId == null) return;
        setResetting(true);
        try {
            await api.post(`/roles/${activeRoleId}/permissions/reset`);
            // Re-fetch permissions from API to get the new default state
            const { data } = await api.get<ApiResponse<RolePermissionsResponse>>(`/roles/${activeRoleId}/permissions`);
            const perms = data.result.permissions;
            const permsClone = perms.map((m: PermissionModule) => ({ ...m }));
            setPermissionsMap((prev) => ({ ...prev, [activeRoleId]: permsClone }));
            setBaselineMap((prev) => ({
                ...prev,
                [activeRoleId]: permsClone,
            }));
            setShowResetConfirm(false);
            showFeedback('success', 'Permissions restored to default');
        } catch {
            showFeedback('danger', 'Failed to reset permissions');
        } finally {
            setResetting(false);
        }
    };

    /* ---------- save changes ---------- */
    const handleSave = async () => {
        if (activeRoleId == null || activePermissions.length === 0) return;
        setSaving(true);
        try {
            const payload = { permissions: activePermissions };
            await api.put(`/roles/${activeRoleId}/permissions`, payload);
            // Update baseline to reflect the saved state
            setBaselineMap((prev) => ({
                ...prev,
                [activeRoleId]: activePermissions.map((m) => ({ ...m })),
            }));
            loadedRolesRef.current.add(activeRoleId);
            showFeedback('success', 'Permissions saved successfully');
        } catch {
            showFeedback('danger', 'Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    /* ---------- add role ---------- */
    const handleAddRole = async () => {
        if (!newRoleName.trim()) return;
        setAddingRole(true);
        try {
            const { data } = await api.post<ApiResponse<RoleEntry>>('/roles', {
                name: newRoleName.trim(),
            });
            const newRole = data.result;
            setRoles((prev) => [...prev, newRole]);
            // Permissions will be fetched automatically when this role is selected
            setActiveRoleId(newRole.id);
            setNewRoleName('');
            setShowAddRole(false);
            showFeedback('success', `Role "${newRole.name}" created`);
        } catch {
            showFeedback('danger', 'Failed to create role');
        } finally {
            setAddingRole(false);
        }
    };

    /* ---------- delete role ---------- */
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingRole, setDeletingRole] = useState(false);

    const handleDeleteRole = async () => {
        if (activeRoleId == null) return;
        setDeletingRole(true);
        try {
            await api.delete(`/roles/${activeRoleId}`);
            setRoles((prev) => prev.filter((r) => r.id !== activeRoleId));
            setPermissionsMap((prev) => {
                const next = { ...prev };
                delete next[activeRoleId];
                return next;
            });
            loadedRolesRef.current.delete(activeRoleId);
            // Switch to first available role
            const remaining = roles.filter((r) => r.id !== activeRoleId);
            setActiveRoleId(remaining.length > 0 ? remaining[0].id : null);
            setShowDeleteConfirm(false);
            showFeedback('success', 'Role deleted successfully');
        } catch {
            showFeedback('danger', 'Failed to delete role');
        } finally {
            setDeletingRole(false);
        }
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

            {/* ---- Feedback Alert ---- */}
            {feedback && (
                <Alert variant={feedback.type} dismissible onClose={() => setFeedback(null)} className="mb-3">
                    {feedback.message}
                </Alert>
            )}

            {/* ---- Main Content ---- */}
            <div className="row justify-content-center">
                {/* Left Column — Roles List */}
                <div className="col-lg-4">
                    <Card>
                        <Card.Body>
                            <h6 className="fs-20 fw-bold mb-4">Roles</h6>
                            {loadingRoles ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Loading roles...
                                </div>
                            ) : (
                                <div className="roles-sidebar d-flex align-items-start">
                                    <Nav
                                        variant="pills"
                                        className="flex-column me-3 w-100"
                                        activeKey={activeRoleId ?? undefined}
                                        onSelect={(k) => {
                                            const id = k ? Number(k) : null;
                                            if (id !== activeRoleId) {
                                                setActiveRoleId(id);
                                            }
                                        }}
                                    >
                                        {roles.map((role) => (
                                            <Nav.Item key={role.id} className="d-flex align-items-center">
                                                <Nav.Link eventKey={role.id} className="text-start flex-grow-1">
                                                    {role.name}
                                                </Nav.Link>
                                                {activeRoleId === role.id && (
                                                    <Icon
                                                        name="trash-2"
                                                        className="text-danger ms-auto me-2"
                                                        style={{
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            position: 'absolute',
                                                            right: '0.5rem',
                                                        }}
                                                        action={(e: React.MouseEvent) => {
                                                            e.stopPropagation();
                                                            setShowDeleteConfirm(true);
                                                        }}
                                                    />
                                                )}
                                            </Nav.Item>
                                        ))}
                                        {roles.length === 0 && (
                                            <p className="text-muted fs-13 mb-0">No roles available</p>
                                        )}
                                    </Nav>
                                </div>
                            )}
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
                                    <h5 className="fs-16 fw-bold mb-0">Role : {activeRoleName}</h5>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <Form.Check
                                        type="checkbox"
                                        id="sync-indicator"
                                        label="Revert All"
                                        checked={!isDirty}
                                        onChange={handleRevertToBaseline}
                                        disabled={!isDirty}
                                        title={
                                            isDirty
                                                ? 'Click to revert to original'
                                                : 'Permissions match the saved state'
                                        }
                                    />
                                </div>
                            </div>

                            {/* Permission Card */}
                            <Card>
                                <Card.Body>
                                    {loadingPerms ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" className="mb-3" />
                                            <p className="mb-0">Loading permissions...</p>
                                        </div>
                                    ) : activePermissions.length === 0 ? (
                                        <div className="text-center py-5">
                                            <Icon name="shield" className="fs-1 text-muted mb-3" />
                                            <p className="mb-0">No permission data available</p>
                                        </div>
                                    ) : (
                                        <>
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
                                                                <td className="text-dark fw-medium">{mod.module}</td>
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
                                                {
                                                    <Button
                                                        variant="outline-warning"
                                                        className="me-auto"
                                                        onClick={() => setShowResetConfirm(true)}
                                                    >
                                                        <Icon name="rotate-ccw" className="me-1" />
                                                        Reset to Default
                                                    </Button>
                                                }
                                                <Button
                                                    variant="light"
                                                    className="me-2"
                                                    onClick={handleRevertToBaseline}
                                                    disabled={!isDirty}
                                                >
                                                    Revert All
                                                </Button>
                                                <Button variant="primary" onClick={handleSave} disabled={saving}>
                                                    {saving ? (
                                                        <>
                                                            <Spinner animation="border" size="sm" className="me-1" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        'Save Changes'
                                                    )}
                                                </Button>
                                            </div>
                                        </>
                                    )}
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
            <Modal show={showAddRole} onHide={() => setShowAddRole(false)} centered>
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
                                disabled={addingRole}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" className="w-100" type="submit" disabled={addingRole}>
                                {addingRole ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* ---- Reset to Default Confirmation Modal ---- */}
            <Modal show={showResetConfirm} onHide={() => setShowResetConfirm(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title text-warning">Reset Permissions</h4>
                </Modal.Header>
                <Modal.Body className="p-4 pt-1">
                    <p>
                        This will reset all permissions for <strong>{activeRoleName}</strong> to the factory default
                        values. This action cannot be undone.
                    </p>
                    <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                        <Button
                            variant="light"
                            className="w-100"
                            onClick={() => setShowResetConfirm(false)}
                            disabled={resetting}
                        >
                            Cancel
                        </Button>
                        <Button variant="warning" className="w-100" onClick={handleResetToDefault} disabled={resetting}>
                            {resetting ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Resetting...
                                </>
                            ) : (
                                'Reset'
                            )}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* ---- Delete Role Confirmation Modal ---- */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title text-danger">Delete Role</h4>
                </Modal.Header>
                <Modal.Body className="p-4 pt-1">
                    <p>
                        Are you sure you want to delete <strong>{activeRoleName}</strong>? This action cannot be undone.
                    </p>
                    <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                        <Button
                            variant="light"
                            className="w-100"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={deletingRole}
                        >
                            Cancel
                        </Button>
                        <Button variant="danger" className="w-100" onClick={handleDeleteRole} disabled={deletingRole}>
                            {deletingRole ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default PermissionsPage;
