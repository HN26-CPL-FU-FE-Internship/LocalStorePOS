import { useCallback, useMemo, useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import Loading from '@/components/common/Loading';
import TopProgressBar from '@/components/common/TopProgressBar';
import Pagination from '@/components/common/Pagination';
import { useEarningReport } from '@/hooks/report/useReportData';
import useDebounce from '@/hooks/useDebounce';
import { PAGE_SIZE, formatDate, formatCurrency, getStatusBadge } from './report-utils';

const EarningReportTab = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortValue>('newest');
    const [page, setPage] = useState(1);
    const [draftFromDate, setDraftFromDate] = useState('');
    const [draftToDate, setDraftToDate] = useState('');
    const [draftCustomerName, setDraftCustomerName] = useState('');
    const [draftPaymentMethod, setDraftPaymentMethod] = useState('');
    const [filter, setFilter] = useState({
        fromDate: undefined as string | undefined,
        toDate: undefined as string | undefined,
        customerName: undefined as string | undefined,
        paymentMethod: undefined as string | undefined,
    });

    const debouncedSearch = useDebounce(searchQuery, 400);

    const queryFilter = useMemo(() => ({
        fromDate: filter.fromDate,
        toDate: filter.toDate,
        customerName: debouncedSearch || filter.customerName || undefined,
        paymentMethod: filter.paymentMethod,
        page: page - 1, // backend uses 0-based page
        size: PAGE_SIZE,
    }), [filter, debouncedSearch, page]);

    const { data, isLoading, isFetching } = useEarningReport(queryFilter);

    const items = data?.items ?? [];
    const totalElements = data?.totalElements ?? 0;

    const handleSubmitFilter = useCallback(() => {
        setFilter({
            fromDate: draftFromDate || undefined,
            toDate: draftToDate || undefined,
            customerName: draftCustomerName || undefined,
            paymentMethod: draftPaymentMethod || undefined,
        });
        setPage(1);
    }, [draftFromDate, draftToDate, draftCustomerName, draftPaymentMethod]);

    if (isLoading) return <Loading />;

    return (
        <>
            <TopProgressBar active={isFetching && !isLoading} />
            <Card.Body>
                {/* Filter */}
                <div className="border-bottom earning-report-filter-wrap d-flex flex-wrap gap-3 pb-3 mb-4">
                    <div className="report-filter">
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control type="date" value={draftFromDate} onChange={(e) => setDraftFromDate(e.target.value)} />
                    </div>
                    <div className="report-filter">
                        <Form.Label>End Date</Form.Label>
                        <Form.Control type="date" value={draftToDate} onChange={(e) => setDraftToDate(e.target.value)} />
                    </div>
                    <div className="report-filter">
                        <Form.Label>Customer</Form.Label>
                        <Form.Control type="text" placeholder="Search customer" value={draftCustomerName} onChange={(e) => setDraftCustomerName(e.target.value)} />
                    </div>
                    <div className="report-filter">
                        <Form.Label>Payment Method</Form.Label>
                        <Form.Control type="text" placeholder="e.g. cash, card" value={draftPaymentMethod} onChange={(e) => setDraftPaymentMethod(e.target.value)} />
                    </div>
                    <div className="report-filter d-flex align-items-end">
                        <Button variant="primary" onClick={handleSubmitFilter}>Submit</Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="d-flex align-items-center flex-wrap gap-3 justify-content-between mb-4">
                    <div className="input-group input-group-flat w-auto">
                        <input className="form-control" placeholder="Search..." type="text" value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
                        <span className="input-group-text"><Icon name="search" className="text-dark" /></span>
                    </div>
                </div>

                {/* Table */}
                <div className="table-responsive table-nowrap">
                    <table className="table mb-0 border">
                        <thead>
                            <tr>
                                <th>Earning ID</th>
                                <th>Date</th>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Type</th>
                                <th>Payment Method</th>
                                <th>Grand Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-4">No earning records found</td></tr>
                            ) : (
                                items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.earningId}</td>
                                        <td>{formatDate(item.date)}</td>
                                        <td>{item.orderNumber}</td>
                                        <td>{item.customerName}</td>
                                        <td>{item.orderType}</td>
                                        <td>{item.paymentMethod}</td>
                                        <td className="fw-medium text-dark">{formatCurrency(item.grandTotal)}</td>
                                        <td>{getStatusBadge(item.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="mt-4">
                    <Pagination totalItems={totalElements} currentPage={page} onPageChange={setPage} pageSize={PAGE_SIZE} />
                </div>
            </Card.Body>
        </>
    );
};

export default EarningReportTab;
