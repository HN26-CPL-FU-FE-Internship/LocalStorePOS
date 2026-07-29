import { useState, useCallback, useMemo } from 'react';
import { Button, Card, Form, Modal, Pagination, Badge, Row, Col, Spinner } from 'react-bootstrap';
import dayjs from 'dayjs';
import Icon from '@/components/common/Icon';
import { useAuditReport, useAuditModules } from '@/hooks/report/useReportData';
import type { AuditLogFilter, AuditLogItem } from '@/types/report';

/** Format a readable label from an enum-style module name. */
const formatLabel = (s: string | null | undefined): string => {
    if (!s) return '-';
    return s
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

/** Colour-coded badge for action status. */
const StatusBadge = ({ status }: { status: string }) => {
    const variant =
        status === 'SUCCESS' ? 'success' :
            status === 'FAILED' ? 'danger' :
                status === 'WARNING' ? 'warning' : 'secondary';
    return <span className={`badge badge-soft-${variant}`}>{status}</span>;
};

const PAGE_SIZE = 15;

const AuditReportTab = () => {
    const [filter, setFilter] = useState<AuditLogFilter>({
        page: 0,
        size: PAGE_SIZE,
    });

    const [detailItem, setDetailItem] = useState<AuditLogItem | null>(null);

    const { data, isLoading, isFetching, isError } = useAuditReport(filter);
    const { data: modules } = useAuditModules();

    // Update a single filter field
    const setFilterField = useCallback(
        (field: keyof AuditLogFilter, value: string | undefined) => {
            setFilter((prev) => ({ ...prev, [field]: value || undefined, page: 0 }));
        },
        [],
    );

    // Navigate to page
    const goToPage = useCallback((page: number) => {
        setFilter((prev) => ({ ...prev, page }));
    }, []);

    // Reset all filters
    const resetFilters = useCallback(() => {
        setFilter({ page: 0, size: PAGE_SIZE });
    }, []);

    // Pagination items
    const paginationItems = useMemo(() => {
        if (!data) return null;
        const { page, totalPages } = data;
        const items: React.ReactNode[] = [];
        const maxVisible = 5;
        let start = Math.max(0, page - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible);
        if (end - start < maxVisible) {
            start = Math.max(0, end - maxVisible);
        }

        items.push(
            <Pagination.Prev key="prev" disabled={page === 0} onClick={() => goToPage(page - 1)} />,
        );
        for (let i = start; i < end; i++) {
            items.push(
                <Pagination.Item key={i} active={i === page} onClick={() => goToPage(i)}>
                    {i + 1}
                </Pagination.Item>,
            );
        }
        items.push(
            <Pagination.Next key="next" disabled={page >= totalPages - 1} onClick={() => goToPage(page + 1)} />,
        );
        return items;
    }, [data, goToPage]);

    // Action options derived from all audit events
    const actionOptions = useMemo(() => {
        // Provide common actions for filter dropdown
        return [
            'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
            'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
            'ORDER_CREATED', 'ORDER_CANCELLED', 'ORDER_COMPLETED',
            'PAYMENT_PROCESSED', 'REFUND_PROCESSED',
            'DISCOUNT_APPLIED',
            'ITEM_CREATED', 'ITEM_UPDATED', 'ITEM_DELETED',
            'SETTINGS_UPDATED', 'SYSTEM_ERROR',
        ];
    }, []);

    return (
        <>
            {/* ── Filters ─────────────────────────────────── */}
            <Card.Body className="border-bottom">
                <Row className="g-2 align-items-end">
                    <Col xs={12} md={2}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">Module</Form.Label>
                            <Form.Select
                                size="sm"
                                value={filter.module ?? ''}
                                onChange={(e) => setFilterField('module', e.target.value)}
                            >
                                <option value="">All Modules</option>
                                {(modules ?? []).map((m) => (
                                    <option key={m} value={m}>{formatLabel(m)}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col xs={12} md={2}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">Action</Form.Label>
                            <Form.Select
                                size="sm"
                                value={filter.action ?? ''}
                                onChange={(e) => setFilterField('action', e.target.value)}
                            >
                                <option value="">All Actions</option>
                                {actionOptions.map((a) => (
                                    <option key={a} value={a}>{formatLabel(a)}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col xs={6} md={2}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">Status</Form.Label>
                            <Form.Select
                                size="sm"
                                value={filter.status ?? ''}
                                onChange={(e) => setFilterField('status', e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="SUCCESS">Success</option>
                                <option value="FAILED">Failed</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col xs={6} md={2}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">From</Form.Label>
                            <Form.Control
                                type="date"
                                size="sm"
                                value={filter.fromDate ?? ''}
                                onChange={(e) => setFilterField('fromDate', e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col xs={6} md={2}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">To</Form.Label>
                            <Form.Control
                                type="date"
                                size="sm"
                                value={filter.toDate ?? ''}
                                onChange={(e) => setFilterField('toDate', e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col xs={6} md={2}>
                        <Form.Group>
                            <Form.Label className="fw-medium small">Search</Form.Label>
                            <Form.Control
                                type="text"
                                size="sm"
                                placeholder="Search description..."
                                value={filter.search ?? ''}
                                onChange={(e) => setFilterField('search', e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col xs={12} className="d-flex gap-2 justify-content-end">
                        <Button variant="outline-secondary" size="sm" onClick={resetFilters}>
                            <Icon name="refresh" className="me-1" /> Reset
                        </Button>
                        {isFetching && <Spinner animation="border" size="sm" className="my-auto" />}
                    </Col>
                </Row>
            </Card.Body>

            {/* ── Table ───────────────────────────────────── */}
            <Card.Body className="p-0">
                {isLoading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="text-muted mt-2 mb-0">Loading audit logs...</p>
                    </div>
                ) : isError ? (
                    <div className="text-center py-5">
                        <Icon name="alert-triangle" className="fs-1 text-danger" />
                        <p className="text-muted mt-2 mb-0">Failed to load audit logs.</p>
                    </div>
                ) : !data || data.items.length === 0 ? (
                    <div className="text-center py-5">
                        <span className="avatar avatar-xxl rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3">
                            <Icon name="clock-arrow-down" className="fs-2 text-muted" />
                        </span>
                        <h5 className="mb-2">No Audit Logs Found</h5>
                        <p className="text-muted mb-0">
                            {filter.module || filter.action || filter.search
                                ? 'Try adjusting your filters.'
                                : 'No activities have been recorded yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover table-nowrap align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '160px' }}>Timestamp</th>
                                    <th style={{ width: '140px' }}>User</th>
                                    <th style={{ width: '110px' }}>Module</th>
                                    <th style={{ width: '110px' }}>Action</th>
                                    <th>Description</th>
                                    <th style={{ width: '90px' }}>Status</th>
                                    <th style={{ width: '60px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((log) => (
                                    <tr key={log.id} className={log.actionStatus === 'FAILED' ? 'table-danger-light' : ''}>
                                        <td className="text-nowrap small">
                                            {dayjs(log.createdAt).format('DD MMM YYYY HH:mm')}
                                        </td>
                                        <td className="small">
                                            <div className="fw-medium">{log.userName}</div>
                                            {log.userEmail && (
                                                <div className="text-muted small">{log.userEmail}</div>
                                            )}
                                        </td>
                                        <td>
                                            <Badge bg="light" text="dark" className="small">
                                                {formatLabel(log.module)}
                                            </Badge>
                                        </td>
                                        <td className="small">{formatLabel(log.action)}</td>
                                        <td className="small text-muted" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {log.description}
                                        </td>
                                        <td>
                                            <StatusBadge status={log.actionStatus} />
                                        </td>
                                        <td>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 text-muted"
                                                onClick={() => setDetailItem(log)}
                                                title="View details"
                                            >
                                                <Icon name="eye" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card.Body>

            {/* ── Pagination ──────────────────────────────── */}
            {data && data.totalPages > 1 && (
                <Card.Footer className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                        Showing {(data.page * data.size) + 1} - {Math.min((data.page + 1) * data.size, data.totalElements)} of {data.totalElements} entries
                    </small>
                    <Pagination className="mb-0" size="sm">
                        {paginationItems}
                    </Pagination>
                </Card.Footer>
            )}

            {/* ── Detail Modal ────────────────────────────── */}
            <Modal show={detailItem !== null} onHide={() => setDetailItem(null)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-6">Audit Log Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detailItem && (
                        <dl className="row mb-0">
                            <dt className="col-sm-3 small text-muted">Timestamp</dt>
                            <dd className="col-sm-9">{dayjs(detailItem.createdAt).format('DD MMM YYYY HH:mm:ss')}</dd>

                            <dt className="col-sm-3 small text-muted">User</dt>
                            <dd className="col-sm-9">
                                {detailItem.userName}
                                {detailItem.userEmail && <span className="text-muted ms-2">({detailItem.userEmail})</span>}
                            </dd>

                            <dt className="col-sm-3 small text-muted">Module</dt>
                            <dd className="col-sm-9">{formatLabel(detailItem.module)}</dd>

                            <dt className="col-sm-3 small text-muted">Action</dt>
                            <dd className="col-sm-9">{formatLabel(detailItem.action)}</dd>

                            <dt className="col-sm-3 small text-muted">Entity</dt>
                            <dd className="col-sm-9">
                                {detailItem.entityType ?? '-'}
                                {detailItem.entityId != null && <> (#{detailItem.entityId})</>}
                            </dd>

                            <dt className="col-sm-3 small text-muted">Description</dt>
                            <dd className="col-sm-9">{detailItem.description}</dd>

                            <dt className="col-sm-3 small text-muted">Status</dt>
                            <dd className="col-sm-9"><StatusBadge status={detailItem.actionStatus} /></dd>

                            <dt className="col-sm-3 small text-muted">IP Address</dt>
                            <dd className="col-sm-9"><code>{detailItem.ipAddress ?? 'N/A'}</code></dd>

                            {detailItem.oldValue && (
                                <>
                                    <dt className="col-sm-3 small text-muted">Old Value</dt>
                                    <dd className="col-sm-9">
                                        <pre className="bg-light p-2 rounded small mb-0" style={{ maxHeight: '120px', overflow: 'auto' }}>{detailItem.oldValue}</pre>
                                    </dd>
                                </>
                            )}
                            {detailItem.newValue && (
                                <>
                                    <dt className="col-sm-3 small text-muted">New Value</dt>
                                    <dd className="col-sm-9">
                                        <pre className="bg-light p-2 rounded small mb-0" style={{ maxHeight: '120px', overflow: 'auto' }}>{detailItem.newValue}</pre>
                                    </dd>
                                </>
                            )}
                        </dl>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setDetailItem(null)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default AuditReportTab;
