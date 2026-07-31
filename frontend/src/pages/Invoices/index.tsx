import { useEffect, useMemo, useState } from 'react';
import { Table, Card, Badge, Button, Dropdown, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/common/Icon';
import ApprovalRequestModal from '@/components/common/ApprovalRequestModal';
import {
    getInvoiceCustomerAvatarUrl,
    getInvoices,
    type InvoiceEntry,
    type InvoiceStatus,
} from '@/api/invoice.api';
import configs from '@/configs';

const statusBadgeClass: Record<InvoiceStatus, string> = {
    paid: 'badge-soft-success',
    unpaid: 'badge-soft-danger',
    partially_paid: 'badge-soft-warning',
    refunded: 'badge-soft-secondary',
    cancelled: 'badge-soft-secondary',
};

const statusLabel: Record<InvoiceStatus, string> = {
    paid: 'Paid',
    unpaid: 'Unpaid',
    partially_paid: 'Partially Paid',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
};

type SortOption = 'newest' | 'oldest';
const sortLabels: Record<SortOption, string> = { newest: 'Newest', oldest: 'Oldest' };

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

const formatCurrency = (value: number) => `$${Number(value).toFixed(2)}`;

const InvoicesPage = () => {
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState<InvoiceEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const [showDeleteApproval, setShowDeleteApproval] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState<InvoiceEntry | null>(null);

    const sortParams = useMemo(
        () =>
            sortOption === 'oldest'
                ? { sortBy: 'invoiceDate', sortDir: 'asc' }
                : { sortBy: 'invoiceDate', sortDir: 'desc' },
        [sortOption],
    );

    const loadInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getInvoices({
                page,
                size,
                sortBy: sortParams.sortBy,
                sortDir: sortParams.sortDir,
                search: search || undefined,
                status: statusFilter || undefined,
            });
            setInvoices(result.items);
            setTotalPages(result.totalPages || 1);
            setTotalElements(result.totalElements);
        } catch {
            setError('Failed to load invoices. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadInvoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, size, sortParams, search, statusFilter]);

    useEffect(() => {
        const handle = setTimeout(() => {
            setPage(1);
            setSearch(searchInput.trim());
        }, 400);
        return () => clearTimeout(handle);
    }, [searchInput]);

    useEffect(() => {
        if (!notice) return;
        const handle = setTimeout(() => setNotice(null), 3000);
        return () => clearTimeout(handle);
    }, [notice]);

    const openDelete = (invoice: InvoiceEntry) => {
        setCurrentInvoice(invoice);
        setShowDeleteApproval(true);
    };


    const goToDetails = (invoice: InvoiceEntry) => {
        navigate(configs.routes.invoiceDetails.replace(':id', String(invoice.id)));
    };

    return (
        <>
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-3 mb-4">
                <div className="flex-grow-1">
                    <h3 className="mb-0">
                        Invoices
                        <Button
                            variant="white"
                            size="sm"
                            className="btn-icon rounded-circle ms-2"
                            aria-label="refresh"
                            onClick={() => loadInvoices()}
                        >
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
            </div>

            {notice && (
                <Alert variant="success" onClose={() => setNotice(null)} dismissible>
                    {notice}
                </Alert>
            )}
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
                                    placeholder="Search invoice or customer"
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
                                style={{ width: 180 }}
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value as InvoiceStatus | '');
                                    setPage(1);
                                }}
                            >
                                <option value="">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="partially_paid">Partially Paid</option>
                                <option value="refunded">Refunded</option>
                                <option value="cancelled">Cancelled</option>
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
                                    <th>Invoice ID</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Order Type</th>
                                    <th>Amount</th>
                                    <th>Status</th>
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

                                {!loading && invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-muted">
                                            No invoices found.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    invoices.map((invoice) => {
                                        const avatarUrl = getInvoiceCustomerAvatarUrl(invoice.customerAvatarPath);
                                        return (
                                            <tr key={invoice.id}>
                                                <td>
                                                    <a
                                                        href="#!"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            goToDetails(invoice);
                                                        }}
                                                    >
                                                        {invoice.invoiceNumber}
                                                    </a>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar avatar-sm avatar-rounded flex-shrink-0 me-2 bg-light d-flex align-items-center justify-content-center overflow-hidden">
                                                            {avatarUrl ? (
                                                                <img src={avatarUrl} alt={invoice.customerName} className="img-fluid" />
                                                            ) : (
                                                                <Icon name="user" className="text-secondary" />
                                                            )}
                                                        </span>
                                                        {invoice.customerName}
                                                    </div>
                                                </td>
                                                <td>{formatDate(invoice.invoiceDate)}</td>
                                                <td className="text-capitalize">{invoice.orderType.replace('_', ' ')}</td>
                                                <td>{formatCurrency(invoice.amount)}</td>
                                                <td>
                                                    <Badge bg="" className={statusBadgeClass[invoice.status]}>
                                                        {statusLabel[invoice.status]}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Button
                                                        variant="white"
                                                        size="sm"
                                                        className="btn-icon rounded-circle me-2"
                                                        onClick={() => goToDetails(invoice)}
                                                        title="View"
                                                    >
                                                        <Icon name="eye" />
                                                    </Button>
                                                    <Button
                                                        variant="white"
                                                        size="sm"
                                                        className="btn-icon rounded-circle"
                                                        onClick={() => openDelete(invoice)}
                                                        title="Delete"
                                                    >
                                                        <Icon name="trash-2" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </Table>
                    </div>

                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3">
                        <p className="mb-0 text-muted fs-13">
                            Showing {invoices.length === 0 ? 0 : (page - 1) * size + 1}-
                            {(page - 1) * size + invoices.length} of {totalElements} invoices
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

            {/* ---- Delete Request Modal (requires approval) ---- */}
            <ApprovalRequestModal
                show={showDeleteApproval}
                onHide={() => setShowDeleteApproval(false)}
                actionLabel="delete"
                requestType="DELETE_IMPORTANT_DATA"
                description={`Delete invoice ${currentInvoice?.invoiceNumber ?? ''}`}
                targetType="INVOICE"
                targetId={currentInvoice?.id}
                targetDisplay={currentInvoice?.invoiceNumber}
                additionalData={
                    currentInvoice
                        ? JSON.stringify({ targetType: 'INVOICE', targetId: currentInvoice.id })
                        : null
                }
                onSent={() => {
                    setShowDeleteApproval(false);
                    setCurrentInvoice(null);
                    setNotice('Delete invoice request sent.');
                }}
            />

        </>
    );
};

export default InvoicesPage;
