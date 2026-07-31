import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Table,
    Card,
    Badge,
    Button,
    Modal,
    Form,
    Spinner,
    Alert,
    Nav,
} from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import Icon from '@/components/common/Icon';
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
    approvalTypeLabels,
    approvalTypeBadgeColors,
} from '@/services/api/approval.api';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 15;

type FilterTab = 'all' | ApprovalStatus;

const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'APPROVED', label: 'Đã duyệt' },
    { key: 'REJECTED', label: 'Từ chối' },
];

const statusBadgeMap: Record<ApprovalStatus, string> = {
    PENDING: 'badge-soft-warning',
    APPROVED: 'badge-soft-success',
    REJECTED: 'badge-soft-danger',
};

const statusLabelMap: Record<ApprovalStatus, string> = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const ApprovalRequestsPage = () => {
    /* ---------- state ---------- */
    const [data, setData] = useState<ApprovalPageResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [pendingCount, setPendingCount] = useState(0);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

    // Detail modal
    const [showDetail, setShowDetail] = useState(false);
    const [detailRequest, setDetailRequest] = useState<ApprovalRequestEntry | null>(null);

    // Action modal (approve / reject)
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const [actionReason, setActionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Type filter
    const [typeFilter, setTypeFilter] = useState<ApprovalRequestType | ''>('');

    /* ---------- helpers ---------- */
    const showFeedback = (type: 'success' | 'danger', message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 4000);
    };

    /* ---------- fetch data ---------- */
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const statusParam = activeTab === 'all' ? undefined : (activeTab as ApprovalStatus);
            const typeParam = typeFilter || undefined;
            const result = await getApprovalRequests({
                page: currentPage - 1,
                size: PAGE_SIZE,
                status: statusParam,
                requestType: typeParam as ApprovalRequestType | undefined,
            });
            setData(result);
        } catch {
            showFeedback('danger', 'Failed to load approval requests');
        } finally {
            setLoading(false);
        }
    }, [currentPage, activeTab, typeFilter]);

    const loadPendingCount = useCallback(async () => {
        try {
            const count = await getPendingApprovalCount();
            setPendingCount(count);
        } catch {
            // Ignore
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        loadPendingCount();
    }, [loadPendingCount]);

    // Refresh pending count after actions
    const refreshData = useCallback(() => {
        loadData();
        loadPendingCount();
    }, [loadData, loadPendingCount]);

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
            showFeedback('danger', 'Vui lòng nhập lý do');
            return;
        }
        setActionLoading(true);
        try {
            if (actionType === 'approve') {
                await approveApprovalRequest(detailRequest.id, actionReason);
                showFeedback('success', 'Đã duyệt yêu cầu thành công');
            } else {
                await rejectApprovalRequest(detailRequest.id, actionReason);
                showFeedback('success', 'Đã từ chối yêu cầu');
            }
            setShowActionModal(false);
            refreshData();
        } catch {
            showFeedback('danger', 'Thao tác thất bại');
        } finally {
            setActionLoading(false);
        }
    };

    /* ---------- derived ---------- */
    const items = data?.items ?? [];
    const totalItems = data?.totalElements ?? 0;

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
                                {pendingCount} yêu cầu chờ duyệt
                            </Badge>
                        )}
                    </div>
                }
            />

            {/* ---- Feedback ---- */}
            {feedback && (
                <Alert variant={feedback.type} dismissible onClose={() => setFeedback(null)} className="mb-3">
                    {feedback.message}
                </Alert>
            )}

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
                                            <Badge bg="warning" className="ms-1">{pendingCount}</Badge>
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
                                <option value="">Tất cả loại</option>
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
                                    <th>Loại yêu cầu</th>
                                    <th>Mô tả</th>
                                    <th>Người yêu cầu</th>
                                    <th>Đối tượng</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
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
                                            <p className="mb-0">Không có yêu cầu nào</p>
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
                                            <Badge
                                                bg=""
                                                className={statusBadgeMap[request.status]}
                                            >
                                                {statusLabelMap[request.status]}
                                            </Badge>
                                        </td>
                                        <td>
                                            <span className="text-muted fs-13">
                                                {new Date(request.createdAt).toLocaleDateString('vi-VN', {
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
                                                    title="Xem chi tiết"
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
                                                            title="Duyệt"
                                                        >
                                                            <Icon name="check-circle" />
                                                        </Button>
                                                        <Button
                                                            variant="white"
                                                            size="sm"
                                                            className="btn-icon rounded-circle text-danger"
                                                            onClick={() => openActionModal('reject', request)}
                                                            title="Từ chối"
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
                    <h4 className="modal-title">Chi tiết yêu cầu</h4>
                </Modal.Header>
                {detailRequest && (
                    <Modal.Body className="p-4 pt-1">
                        {/* Status & Type */}
                        <div className="d-flex align-items-center gap-2 mb-4">
                            <Badge
                                bg=""
                                className={statusBadgeMap[detailRequest.status]}
                            >
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
                                    <small className="text-muted d-block mb-1">Người yêu cầu</small>
                                    <strong>{detailRequest.requestedByName}</strong>
                                    <div className="fs-13 text-muted">{detailRequest.requestedByEmail}</div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 bg-light rounded">
                                    <small className="text-muted d-block mb-1">Ngày tạo</small>
                                    <strong>
                                        {new Date(detailRequest.createdAt).toLocaleDateString('vi-VN', {
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
                                            {detailRequest.status === 'APPROVED' ? 'Người duyệt' : 'Người từ chối'}
                                        </small>
                                        <strong>{detailRequest.approvedByName}</strong>
                                        <div className="fs-13 text-muted">{detailRequest.approvedByEmail}</div>
                                    </div>
                                </div>
                            )}
                            {detailRequest.resolvedAt && (
                                <div className="col-md-6">
                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted d-block mb-1">Ngày xử lý</small>
                                        <strong>
                                            {new Date(detailRequest.resolvedAt).toLocaleDateString('vi-VN', {
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
                                <small className="text-muted d-block mb-1">Đối tượng</small>
                                <div className="p-3 bg-light rounded">
                                    <strong>{detailRequest.targetDisplay}</strong>
                                    {detailRequest.targetType && (
                                        <div className="fs-13 text-muted">Loại: {detailRequest.targetType}</div>
                                    )}
                                    {detailRequest.targetId && (
                                        <div className="fs-13 text-muted">ID: {detailRequest.targetId}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="mb-3">
                            <small className="text-muted d-block mb-1">Mô tả</small>
                            <div className="p-3 bg-light rounded">
                                <p className="mb-0">{detailRequest.description}</p>
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="mb-3">
                            <small className="text-muted d-block mb-1">Lý do</small>
                            <div className="p-3 bg-light rounded">
                                <p className="mb-0">{detailRequest.reason}</p>
                            </div>
                        </div>

                        {/* Resolution reason (for both approved and rejected) */}
                        {detailRequest.rejectionReason && (
                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">
                                    {detailRequest.status === 'APPROVED' ? 'Lý do duyệt' : 'Lý do từ chối'}
                                </small>
                                <div className={`p-3 rounded ${detailRequest.status === 'APPROVED' ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
                                    <p className={`mb-0 ${detailRequest.status === 'APPROVED' ? 'text-success' : 'text-danger'}`}>
                                        {detailRequest.rejectionReason}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Old / New Value */}
                        {detailRequest.oldValue && (
                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">Giá trị cũ</small>
                                <div className="p-3 bg-light rounded">
                                    <pre className="mb-0 fs-13" style={{ whiteSpace: 'pre-wrap' }}>{detailRequest.oldValue}</pre>
                                </div>
                            </div>
                        )}
                        {detailRequest.newValue && (
                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">Giá trị mới</small>
                                <div className="p-3 bg-light rounded">
                                    <pre className="mb-0 fs-13" style={{ whiteSpace: 'pre-wrap' }}>{detailRequest.newValue}</pre>
                                </div>
                            </div>
                        )}

                        {/* Additional Data */}
                        {detailRequest.additionalData && (
                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">Dữ liệu bổ sung</small>
                                <div className="p-3 bg-light rounded">
                                    <pre className="mb-0 fs-13" style={{ whiteSpace: 'pre-wrap' }}>{detailRequest.additionalData}</pre>
                                </div>
                            </div>
                        )}
                    </Modal.Body>
                )}
                <Modal.Footer className="border-0 p-4 pt-0">
                    <Button variant="light" onClick={() => setShowDetail(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ================================================================ */}
            {/*  ACTION CONFIRM MODAL (Approve / Reject)                        */}
            {/* ================================================================ */}
            <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className={`modal-title ${actionType === 'approve' ? 'text-success' : 'text-danger'}`}>
                        {actionType === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
                    </h4>
                </Modal.Header>
                <Modal.Body className="p-4 pt-1">
                    {detailRequest && (
                        <p>
                            {actionType === 'approve'
                                ? 'Bạn có chắc chắn muốn duyệt yêu cầu này?'
                                : 'Bạn có chắc chắn muốn từ chối yêu cầu này?'}
                        </p>
                    )}
                    <Form.Group className="mb-3">
                        <Form.Label>
                            Lý do <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="Nhập lý do..."
                        />
                    </Form.Group>
                    <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                        <Button
                            variant="light"
                            className="w-100"
                            onClick={() => setShowActionModal(false)}
                            disabled={actionLoading}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant={actionType === 'approve' ? 'success' : 'danger'}
                            className="w-100"
                            onClick={handleActionConfirm}
                            disabled={actionLoading || !actionReason.trim()}
                        >
                            {actionLoading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Đang xử lý...
                                </>
                            ) : (
                                actionType === 'approve' ? 'Duyệt' : 'Từ chối'
                            )}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default ApprovalRequestsPage;
