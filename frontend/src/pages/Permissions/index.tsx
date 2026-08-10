import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Table, Card, Button, Modal, Form, Nav, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import Icon from '@/components/common/Icon';
import ApprovalRequestModal from '@/components/common/ApprovalRequestModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import useAuth from '@/hooks/useAuth';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
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
    const { isAdmin } = useAuth();

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

    // Reset to default
    const [showResetApproval, setShowResetApproval] = useState(false);

    // Add Role modal
    const [showAddRole, setShowAddRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [addingRole, setAddingRole] = useState(false);

    // Track whether permissions have been loaded for the active role
    const loadedRolesRef = useRef<Set<number>>(new Set());
    // const prevActiveRoleRef = useRef<number | null>(null);

    /* ---------- helpers ---------- */
    const { showToast } = useContextData(ToastContext);

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
            showToast('error', 'Failed to load roles');
        } finally {
            setLoadingRoles(false);
        }
    }, [activeRoleId, showToast]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------- fetch permissions when active role changes ---------- */
    const fetchPermissions = useCallback(
        async (roleId: number) => {
            setLoadingPerms(true);
            try {
                const { data } = await api.get<ApiResponse<RolePermissionsResponse>>(
                    `/roles/${roleId}/permissions`,
                );
                const perms = data.result.permissions;
                const permsClone = perms.map((m: PermissionModule) => ({ ...m }));
                setPermissionsMap((prev) => ({ ...prev, [roleId]: permsClone }));
                setBaselineMap((prev) => ({
                    ...prev,
                    [roleId]: permsClone,
                }));
                loadedRolesRef.current.add(roleId);
            } catch {
                showToast('error', 'Failed to load permissions');
            } finally {
                setLoadingPerms(false);
            }
        },
        [showToast],
    );

    useEffect(() => {
        if (activeRoleId == null) return;

        // Avoid re-fetching if we already have the data from the API
        if (loadedRolesRef.current.has(activeRoleId)) {
            return;
        }

        fetchPermissions(activeRoleId);
    }, [activeRoleId, fetchPermissions]);

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

    // Reset to default requires approval before it is applied — admins reset
    // directly.
    const openResetApproval = () => {
        if (isAdmin) {
            handleResetDirect();
        } else {
            setShowResetApproval(true);
        }
    };

    const handleResetDirect = async () => {
        if (activeRoleId == null) return;
        try {
            await api.post(`/roles/${activeRoleId}/permissions/reset`);
            // Reload the role permissions so the UI reflects the defaults
            loadedRolesRef.current.delete(activeRoleId);
            await fetchPermissions(activeRoleId);
            showToast('success', 'Permissions reset to default.');
        } catch {
            showToast('error', 'Failed to reset permissions');
        }
    };

    const handleSendResetApproval = () => {
        setShowResetApproval(false);
        showToast('info', 'Permission reset request sent. Please wait for approval.');
    };

    // Save changes requires approval before they take effect — admins save
    // directly.
    const [showSaveApproval, setShowSaveApproval] = useState(false);

    const handleSaveDirect = async () => {
        if (activeRoleId == null) return;
        try {
            await api.put(`/roles/${activeRoleId}/permissions`, {
                permissions: activePermissions,
            });
            // Refresh the baseline so the dirty-state indicator clears
            setBaselineMap((prev) => ({
                ...prev,
                [activeRoleId]: activePermissions.map((m) => ({ ...m })),
            }));
            showToast('success', 'Permissions updated successfully.');
        } catch {
            showToast('error', 'Failed to update permissions');
        }
    };

    const handleSendSaveApproval = () => {
        setShowSaveApproval(false);
        showToast('info', 'Permission change request sent. Please wait for approval.');
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
            showToast('success', `Role "${newRole.name}" created`);
        } catch {
            showToast('error', 'Failed to create role');
        } finally {
            setAddingRole(false);
        }
    };

    // Delete role requires approval before it is applied — admins delete
    // directly after a confirmation.
    const [showDeleteRoleApproval, setShowDeleteRoleApproval] = useState(false);
    const [showDeleteRoleConfirm, setShowDeleteRoleConfirm] = useState(false);
    const [deletingRole, setDeletingRole] = useState(false);

    const openDeleteRoleApproval = () => {
        if (isAdmin) {
            setShowDeleteRoleConfirm(true);
        } else {
            setShowDeleteRoleApproval(true);
        }
    };

    const handleDeleteRoleConfirm = async () => {
        if (activeRoleId == null) return;
        setDeletingRole(true);
        try {
            await api.delete(`/roles/${activeRoleId}`);
            setShowDeleteRoleConfirm(false);
            const nextRoles = roles.filter((r) => r.id !== activeRoleId);
            setRoles(nextRoles);
            setActiveRoleId(nextRoles.length > 0 ? nextRoles[0].id : null);
            showToast('success', 'Role deleted successfully.');
        } catch {
            showToast('error', 'Failed to delete role');
        } finally {
            setDeletingRole(false);
        }
    };

    const handleSendDeleteRoleApproval = () => {
        setShowDeleteRoleApproval(false);
        showToast('info', 'Role deletion request sent. Please wait for approval.');
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
                                                            openDeleteRoleApproval();
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
                                                        onClick={openResetApproval}
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
                                                <Button variant="primary" onClick={() => (isAdmin ? handleSaveDirect() : setShowSaveApproval(true))}>
                                                    Save Changes
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

            {/* ---- Save Changes Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showSaveApproval}
                onHide={() => setShowSaveApproval(false)}
                actionLabel="save changes"
                requestType="PERMISSION_CHANGE"
                description={`Change permissions of role ${activeRoleName}`}
                targetType="ROLE"
                targetId={activeRoleId}
                targetDisplay={activeRoleName}
                additionalData={
                    activeRoleId != null
                        ? JSON.stringify({
                              action: 'UPDATE_PERMISSIONS',
                              roleId: activeRoleId,
                              permissions: activePermissions,
                          })
                        : null
                }
                onSent={handleSendSaveApproval}
            />

            {/* ---- Reset to Default Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showResetApproval}
                onHide={() => setShowResetApproval(false)}
                actionLabel="reset permissions"
                requestType="PERMISSION_CHANGE"
                description={`Reset permissions of role ${activeRoleName} to default`}
                targetType="ROLE"
                targetId={activeRoleId}
                targetDisplay={activeRoleName}
                additionalData={
                    activeRoleId != null
                        ? JSON.stringify({ action: 'RESET_PERMISSIONS', roleId: activeRoleId })
                        : null
                }
                onSent={handleSendResetApproval}
            />

            {/* ---- Delete Role Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showDeleteRoleApproval}
                onHide={() => setShowDeleteRoleApproval(false)}
                actionLabel="delete role"
                requestType="PERMISSION_CHANGE"
                description={`Delete role ${activeRoleName}`}
                targetType="ROLE"
                targetId={activeRoleId}
                targetDisplay={activeRoleName}
                additionalData={
                    activeRoleId != null
                        ? JSON.stringify({ action: 'DELETE_ROLE', roleId: activeRoleId })
                        : null
                }
                onSent={handleSendDeleteRoleApproval}
            />

            {/* ---- Delete Role Confirmation (admins delete directly) ---- */}
            <ConfirmModal
                show={showDeleteRoleConfirm}
                handleClose={() => setShowDeleteRoleConfirm(false)}
                type="delete"
                action={handleDeleteRoleConfirm}
                data={activeRoleName}
                actionDisabled={deletingRole}
            />

        </>
    );
};

export default PermissionsPage;
