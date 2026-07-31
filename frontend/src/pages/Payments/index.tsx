import { useEffect, useMemo, useState } from 'react';
import { Table, Card, Badge, Button, Dropdown, Form, Alert, Spinner } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import { getPayments, type PaymentEntry, type PaymentStatus } from '@/api/payment.api';

const statusBadgeClass: Record<PaymentStatus, string> = {
    success: 'badge-soft-success',
    pending: 'badge-soft-warning',
    failed: 'badge-soft-danger',
    refunded: 'badge-soft-secondary',
};

type SortOption = 'newest' | 'oldest';
const sortLabels: Record<SortOption, string> = { newest: 'Newest', oldest: 'Oldest' };

const formatCurrency = (value: number) => `$${Number(value).toFixed(2)}`;

const PaymentsPage = () => {
    const [payments, setPayments] = useState<PaymentEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const sortParams = useMemo(
        () => (sortOption === 'oldest' ? { sortBy: 'paidAt', sortDir: 'asc' } : { sortBy: 'paidAt', sortDir: 'desc' }),
        [sortOption],
    );

    const loadPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getPayments({
                page,
                size,
                sortBy: sortParams.sortBy,
                sortDir: sortParams.sortDir,
                search: search || undefined,
                status: statusFilter || undefined,
            });
            setPayments(result.items);
            setTotalPages(result.totalPages || 1);
            setTotalElements(result.totalElements);
        } catch {
            setError('Không thể tải danh sách giao dịch. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadPayments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, size, sortParams, search, statusFilter]);

    useEffect(() => {
        const handle = setTimeout(() => {
            setPage(1);
            setSearch(searchInput.trim());
        }, 400);
        return () => clearTimeout(handle);
    }, [searchInput]);

    return (
        <>
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-3 mb-4">
                <div className="flex-grow-1">
                    <h3 className="mb-0">
                        Payments
                        <Button
                            variant="white"
                            size="sm"
                            className="btn-icon rounded-circle ms-2"
                            aria-label="refresh"
                            onClick={() => loadPayments()}
                        >
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
            </div>

            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            <Card className="mb-0">
                <Card.Body>
                    <div className="d-flex align-items-center flex-wrap gap-3 justify-content-between mb-4">
                        <div className="search-input">
                            <div className="datatable-search position-relative">
                                <input
                                    className="form-control form-control-sm"
                                    placeholder="Search transaction, order or customer"
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                <Icon
                                    name="search"
                                    className="position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
                                />
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <Form.Select
                                style={{ width: 160 }}
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value as PaymentStatus | '');
                                    setPage(1);
                                }}
                            >
                                <option value="">All Status</option>
                                <option value="success">Success</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                            </Form.Select>

                            <Dropdown>
                                <Dropdown.Toggle as={Button} variant="white" className="d-inline-flex align-items-center">
                                    Sort by : {sortLabels[sortOption]}
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" className="p-3">
                                    {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                                        <Dropdown.Item
                                            key={opt}
                                            active={opt === sortOption}
                                            onClick={() => {
                                                setSortOption(opt);
                                                setPage(1);
                                            }}
                                        >
                                            {sortLabels[opt]}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>

                    <div className="table-responsive table-nowrap">
                        <Table className="mb-0 border">
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>Order ID</th>
                                    <th>Token No</th>
                                    <th>Customer</th>
                                    <th>Type</th>
                                    <th>Menus</th>
                                    <th>Grand Total</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={9} className="text-center py-4">
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Loading...
                                        </td>
                                    </tr>
                                )}

                                {!loading && payments.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center py-4 text-muted">
                                            No payments found.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>{payment.transactionId}</td>
                                            <td>{payment.orderNumber}</td>
                                            <td>{payment.tokenNo ?? '-'}</td>
                                            <td>{payment.customerName}</td>
                                            <td className="text-capitalize">{payment.orderType.replace('_', ' ')}</td>
                                            <td>{payment.itemCount}</td>
                                            <td>{formatCurrency(payment.grandTotal)}</td>
                                            <td>{payment.paymentMethodName}</td>
                                            <td>
                                                <Badge bg="" className={statusBadgeClass[payment.status]}>
                                                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </Table>
                    </div>

                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3">
                        <p className="mb-0 text-muted fs-13">
                            Showing {payments.length === 0 ? 0 : (page - 1) * size + 1}-
                            {(page - 1) * size + payments.length} of {totalElements} transactions
                        </p>
                        <div className="d-flex align-items-center gap-2">
                            <Button
                                variant="white"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                Previous
                            </Button>
                            <span className="fs-13">
                                Page {page} / {totalPages}
                            </span>
                            <Button
                                variant="white"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </>
    );
};

export default PaymentsPage;
