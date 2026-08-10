import { useCallback, useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Table, Card, Badge, Button, Modal, Form, Spinner, Nav } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import { queryClient } from '@/lib';
import Icon from '@/components/common/Icon';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import Pagination from '@/components/common/Pagination';
import {
    getApprovalRequests,
    approveApprovalRequest,
    rejectApprovalRequest,
    getPendingApprovalCount,
    type ApprovalRequestEntry,
    type ApprovalRequestType,
    type ApprovalStatus,
    type ApprovalPageResponse,
    type ApprovalActionPayload,
    approvalTypeLabels,
    approvalTypeBadgeColors,
} from '@/services/api/approval.api';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 15;

type FilterTab = 'all' | ApprovalStatus;

const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'FAILED', label: 'Failed' },
];

const statusBadgeMap: Record<ApprovalStatus, string> = {
    PENDING: 'badge-soft-warning',
    APPROVED: 'badge-soft-success',
    REJECTED: 'badge-soft-danger',
    FAILED: 'badge-soft-danger',
};

const statusLabelMap: Record<ApprovalStatus, string> = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    FAILED: 'Failed',
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const ApprovalRequestsPage = () => {
    /* ---------- state ---------- */
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');

    // Detail modal
    const [showDetail, setShowDetail] = useState(false);
    const [detailRequest, setDetailRequest] = useState<ApprovalRequestEntry | null>(null);

    // Action modal (approve / reject)
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const [actionReason, setActionReason] = useState('');

    // Type filter
    const [typeFilter, setTypeFilter] = useState<ApprovalRequestType | ''>('');

    /* ---------- helpers ---------- */
    const { showToast } = useContextData(ToastContext);

    /* ---------- data (TanStack Query) ---------- */
    const approvalQuery = useQuery<ApprovalPageResponse>({
        queryKey: [
            'approval-requests',
            'list',
            {
                page: currentPage,
                size: PAGE_SIZE,
                status: activeTab === 'all' ? undefined : activeTab,
                requestType: typeFilter || undefined,
            },
        ],
        queryFn: () =>
            getApprovalRequests({
                page: currentPage - 1,
                size: PAGE_SIZE,
                status: activeTab === 'all' ? undefined : (activeTab as ApprovalStatus),
                requestType: typeFilter || undefined,
            }),
        placeholderData: keepPreviousData,
    });

    const { data: pendingCount = 0 } = useQuery({
        queryKey: ['approval-requests', 'pending-count'],
        queryFn: getPendingApprovalCount,
        staleTime: 1000 * 60,
    });

    const approveMutation = useMutation({
        mutationFn: (payload: ApprovalActionPayload) => approveApprovalRequest(payload.requestId, payload.reason),
        onSuccess: () => {
            showToast('success', 'Request approved successfully');
            queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
        },
        onError: () => showToast('error', 'Action failed'),
    });

    const rejectMutation = useMutation({
        mutationFn: (payload: ApprovalActionPayload) => rejectApprovalRequest(payload.requestId, payload.reason),
        onSuccess: () => {
            showToast('success', 'Request rejected');
            queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
        },
        onError: () => showToast('error', 'Action failed'),
    });

    // Refresh after actions / when a new approval request arrives via WebSocket
    const refreshData = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
    }, []);

    // Auto-refresh when a new/updated approval request arrives via WebSocket
    useEffect(() => {
        const onApprovalChanged = () => refreshData();
        window.addEventListener('approval-requests-changed', onApprovalChanged);
        return () => window.removeEventListener('approval-requests-changed', onApprovalChanged);
    }, [refreshData]);

    /* ---------- page change ---------- */
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    /* ---------- tab change ---------- */
    const handleTabChange = (tab: FilterTab) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    /* ---------- type filter change ---------- */
    const handleTypeFilterChange = (type: ApprovalRequestType | '') => {
        setTypeFilter(type);
        setCurrentPage(1);
    };

    /* ---------- detail ---------- */
    const openDetail = (request: ApprovalRequestEntry) => {
        setDetailRequest(request);
        setShowDetail(true);
    };

    /* ---------- action (approve / reject) ---------- */
    const openActionModal = (type: 'approve' | 'reject', request: ApprovalRequestEntry) => {
        setDetailRequest(request);
        setActionType(type);
        setActionReason('');
        setShowActionModal(true);
    };

    const handleActionConfirm = async () => {
        if (!detailRequest) return;
        if (!actionReason.trim()) {
            showToast('error', 'Please enter a reason');
            return;
        }
        const payload: ApprovalActionPayload = { requestId: detailRequest.id, reason: actionReason };
        const mutation = actionType === 'approve' ? approveMutation : rejectMutation;
        mutation.mutate(payload, {
            onSuccess: () => setShowActionModal(false),
        });
    };

    /* ---------- derived ---------- */
    const items = approvalQuery.data?.items ?? [];
    const totalItems = approvalQuery.data?.totalElements ?? 0;
    const loading = approvalQuery.isLoading || (approvalQuery.isFetching && !approvalQuery.data);
    const isActionPending = approveMutation.isPending || rejectMutation.isPending;

    /* ---------- render ---------- */
    return (
        <>
            {/* ---- Page Header ---- */}
            <PageHeader
                title="Approval Requests"
                onRefresh={refreshData}
                action={
                    <div className="d-flex align-items-center gap-2">
                        {pendingCount > 0 && (
                            <Badge bg="warning" className="fs-13 px-3 py-2">
                                <Icon name="clock" className="me-1" />
                                {pendingCount} pending requests
                            </Badge>
                        )}
                    </div>
                }
            />


            {/* ---- Filter Tabs ---- */}
            <Card className="mb-3">
                <Card.Body className="py-3">
                    <div className="d-flex align-items-center flex-wrap gap-3">
                        <Nav
                            variant="pills"
                            className="flex-wrap"
                            activeKey={activeTab}
                            onSelect={(k) => {
                                if (k) handleTabChange(k as FilterTab);
                            }}
                        >
                            {filterTabs.map((tab) => (
                                <Nav.Item key={tab.key}>
                                    <Nav.Link eventKey={tab.key} className="fs-13">
                                        {tab.label}
                                        {tab.key === 'PENDING' && pendingCount > 0 && (
                                            <Badge bg="warning" className="ms-1">
                                                {pendingCount}
                                            </Badge>
                                        )}
                                    </Nav.Link>
                                </Nav.Item>
                            ))}
                        </Nav>

                        {/* Type filter */}
                        <div className="ms-auto">
                            <Form.Select
                                size="sm"
                                value={typeFilter}
                                onChange={(e) => handleTypeFilterChange(e.target.value as ApprovalRequestType | '')}
                                style={{ minWidth: 200 }}
                            >
                                <option value="">All types</option>
                                {(Object.keys(approvalTypeLabels) as ApprovalRequestType[]).map((type) => (
                                    <option key={type} value={type}>
                                        {approvalTypeLabels[type]}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* ---- Table ---- */}
            <Card>
                <Card.Body>
                    <div className="table-responsive table-nowrap">
                        <Table className="mb-0 border">
                            <thead>
                                <tr>
                                    <th>Request Type</th>
                                    <th>Description</th>
                                    <th>Requested By</th>
                                    <th>Target</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4">
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Loading...
                                        </td>
                                    </tr>
                                )}
                                {!loading && items.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4">
                                            <Icon name="clipboard-check" className="fs-1 text-muted mb-2" />
                                            <p className="mb-0">No requests found</p>
                                        </td>
                                    </tr>
                                )}
                                {items.map((request) => (
                                    <tr key={request.id}>
                                        <td>
                                            <Badge
                                                bg=""
                                                className={`badge-soft-${approvalTypeBadgeColors[request.requestType] || 'secondary'}`}
                                            >
                                                {approvalTypeLabels[request.requestType]}
                                            </Badge>
                                        </td>
                                        <td className="text-wrap" style={{ maxWidth: 250 }}>
                                            <span className="text-dark fw-medium">{request.description}</span>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="avatar avatar-sm bg-light rounded-circle d-flex align-items-center justify-content-center me-2">
                                                    <Icon name="user" className="fs-12" />
                                                </div>
                                                <div>
                                                    <div className="fs-13 fw-medium">{request.requestedByName}</div>
                                                    <div className="fs-12 text-muted">{request.requestedByEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {request.targetDisplay ? (
                                                <span className="text-muted">{request.targetDisplay}</span>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <Badge bg="" className={statusBadgeMap[request.status]}>
                                                {statusLabelMap[request.status]}
                                            </Badge>
                                        </td>
                                        <td>
                                            <span className="text-muted fs-13">
                                                {new Date(request.createdAt).toLocaleDateString('en-US', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <Button
                                                    variant="white"
                                                    size="sm"
                                                    className="btn-icon rounded-circle"
                                                    onClick={() => openDetail(request)}
                                                    title="View Details"
                                                >
                                                    <Icon name="eye" />
                                                </Button>
                                                {request.status === 'PENDING' && (
                                                    <>
                                                        <Button
                                                            variant="white"
                                                            size="sm"
                                                            className="btn-icon rounded-circle text-success"
                                                            onClick={() => openActionModal('approve', request)}
                                                            title="Approve"
                                                        >
                                                            <Icon name="check-circle" />
                                                        </Button>
                                                        <Button
                                                            variant="white"
                                                            size="sm"
                                                            className="btn-icon rounded-circle text-danger"
                                                            onClick={() => openActionModal('reject', request)}
                                                            title="Reject"
                                                        >
                                                            <Icon name="x-circle" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                    <Pagination
                        totalItems={totalItems}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                        pageSize={PAGE_SIZE}
                    />
                </Card.Body>
            </Card>

            {/* ================================================================ */}
            {/*  DETAIL MODAL                                                    */}
            {/* ================================================================ */}
            <Modal show={showDetail} onHide={() => setShowDetail(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Request Details</h4>
                </Modal.Header>
                {detailRequest && (
                    <Modal.Body className="p-4 pt-1">
                        {/* Status & Type */}
                        <div className="d-flex align-items-center gap-2 mb-4">
                            <Badge bg="" className={statusBadgeMap[detailRequest.status]}>
                                {statusLabelMap[detailRequest.status]}
                            </Badge>
                            <Badge
                                bg=""
                                className={`badge-soft-${approvalTypeBadgeColors[detailRequest.requestType] || 'secondary'}`}
                            >
                                {approvalTypeLabels[detailRequest.requestType]}
                            </Badge>
                        </div>

                        {/* Info grid */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="p-3 bg-light rounded">
                                    <small className="text-muted d-block mb-1">Requested By</small>
                                    <strong>{detailRequest.requestedByName}</strong>
                                    <div className="fs-13 text-muted">{detailRequest.requestedByEmail}</div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 bg-light rounded">
                                    <small className="text-muted d-block mb-1">Created At</small>
                                    <strong>
                                        {new Date(detailRequest.createdAt).toLocaleDateString('en-US', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </strong>
                                </div>
                            </div>
                            {detailRequest.approvedByName && (
                                <div className="col-md-6">
                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted d-block mb-1">
                                            {detailRequest.status === 'REJECTED' ? 'Rejected By' : 'Approved By'}
                                        </small>
                                        <strong>{detailRequest.approvedByName}</strong>
                                        <div className="fs-13 text-muted">{detailRequest.approvedByEmail}</div>
                                    </div>
                                </div>
                            )}
                            {detailRequest.resolvedAt && (
                                <div className="col-md-6">
                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted d-block mb-1">Resolved At</small>
                                        <strong>
                                            {new Date(detailRequest.resolvedAt).toLocaleDateString('en-US', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </strong>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Target info */}
                        {detailRequest.targetDisplay && (
                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">Target</small>
                                <div className="p-3 bg-light rounded">
                                    <strong>{detailRequest.targetDisplay}</strong>
                                    {detailRequest.targetType && (
                                        <div className="fs-13 text-muted">Type: {detailRequest.targetType}</div>
                                    )}
                                    {detailRequest.targetId && (
                                        <div className="fs-13 text-muted">ID: {detailRequest.targetId}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="mb-3">
                            <small className="text-muted d-block mb-1">Description</small>
                            <div className="p-3 bg-light rounded">
                                <p className="mb-0">{detailRequest.description}</p>
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="mb-3">
                            <small className="text-muted d-block mb-1">Reason</small>
                            <div className="p-3 bg-light rounded">
                                <p className="mb-0">{detailRequest.reason}</p>
                            </div>
                        </div>

                        {/* Resolution reason (for approved, rejected and failed) */}
                        {detailRequest.rejectionReason && (
                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">
                                    {detailRequest.status === 'REJECTED'
                                        ? 'Rejection Reason'
                                        : detailRequest.status === 'FAILED'
                                          ? 'Approval Reason (Execution Failed)'
                                          : 'Approval Reason'}
                                </small>
                                <div
                                    className={`p-3 rounded ${detailRequest.status === 'APPROVED' ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}
                                >
                                    <p
                                        className={`mb-0 ${detailRequest.status === 'APPROVED' ? 'text-success' : 'text-danger'}`}
                                    >
                                        {detailRequest.rejectionReason}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Old / New Value */}
                        {detailRequest.oldValue && (
                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">Old Value</small>
                                <div className="p-3 bg-light rounded">
                                    <pre className="mb-0 fs-13" style={{ whiteSpace: 'pre-wrap' }}>
                                        {detailRequest.oldValue}
                                    </pre>
                                </div>
                            </div>
                        )}
                        {detailRequest.newValue && (
                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">New Value</small>
                                <div className="p-3 bg-light rounded">
                                    <pre className="mb-0 fs-13" style={{ whiteSpace: 'pre-wrap' }}>
                                        {detailRequest.newValue}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Additional Data */}
                        {detailRequest.additionalData && (
                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">Additional Data</small>
                                <div className="p-3 bg-light rounded">
                                    <pre className="mb-0 fs-13" style={{ whiteSpace: 'pre-wrap' }}>
                                        {detailRequest.additionalData}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </Modal.Body>
                )}
                <Modal.Footer className="border-0 p-4 pt-0">
                    <Button variant="light" onClick={() => setShowDetail(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ================================================================ */}
            {/*  ACTION CONFIRM MODAL (Approve / Reject)                        */}
            {/* ================================================================ */}
            <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className={`modal-title ${actionType === 'approve' ? 'text-success' : 'text-danger'}`}>
                        {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                    </h4>
                </Modal.Header>
                <Modal.Body className="p-4 pt-1">
                    {detailRequest && (
                        <p>
                            {actionType === 'approve'
                                ? 'Are you sure you want to approve this request?'
                                : 'Are you sure you want to reject this request?'}
                        </p>
                    )}
                    <Form.Group className="mb-3">
                        <Form.Label>
                            Reason <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="Enter reason..."
                        />
                    </Form.Group>
                    <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                        <Button
                            variant="light"
                            className="w-100"
                            onClick={() => setShowActionModal(false)}
                            disabled={isActionPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={actionType === 'approve' ? 'success' : 'danger'}
                            className="w-100"
                            onClick={handleActionConfirm}
                            disabled={isActionPending || !actionReason.trim()}
                        >
                            {isActionPending ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Processing...
                                </>
                            ) : actionType === 'approve' ? (
                                'Approve'
                            ) : (
                                'Reject'
                            )}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default ApprovalRequestsPage;
