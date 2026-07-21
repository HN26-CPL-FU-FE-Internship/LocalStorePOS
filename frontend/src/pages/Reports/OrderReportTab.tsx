import { useCallback, useMemo, useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import Loading from '@/components/common/Loading';
import TopProgressBar from '@/components/common/TopProgressBar';
import Pagination from '@/components/common/Pagination';
import { useOrderReport } from '@/hooks/report/useReportData';
import useDebounce from '@/hooks/useDebounce';
import { PAGE_SIZE, sortOptions, type SortValue, formatDate, formatCurrency, getStatusBadge } from './report-utils';

const OrderReportTab = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortValue>('newest');
    const [page, setPage] = useState(1);
    const [draftFromDate, setDraftFromDate] = useState('');
    const [draftToDate, setDraftToDate] = useState('');
    const [draftCustomerName, setDraftCustomerName] = useState('');
    const [filter, setFilter] = useState({
        fromDate: undefined as string | undefined,
        toDate: undefined as string | undefined,
        customerName: undefined as string | undefined,
    });

    const debouncedSearch = useDebounce(searchQuery, 400);

    const queryFilter = useMemo(() => ({
        fromDate: filter.fromDate,
        toDate: filter.toDate,
        customerName: debouncedSearch || filter.customerName || undefined,
    }), [filter, debouncedSearch]);

    const { data, isLoading, isFetching } = useOrderReport(queryFilter);

    const sortedData = useMemo(() => {
        const items = data?.result ?? [];
        if (items.length === 0) return [];

        const sorted = [...items];
        switch (sortBy) {
            case 'oldest':
                sorted.sort((a, b) => (a.date > b.date ? 1 : -1));
                break;
            case 'asc':
                sorted.sort((a, b) => (a.grandTotal ?? 0) - (b.grandTotal ?? 0));
                break;
            case 'desc':
                sorted.sort((a, b) => (b.grandTotal ?? 0) - (a.grandTotal ?? 0));
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => (a.date < b.date ? 1 : -1));
                break;
        }
        return sorted;
    }, [data, sortBy]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return sortedData.slice(start, start + PAGE_SIZE);
    }, [sortedData, page]);

    const handleSubmitFilter = useCallback(() => {
        setFilter({
            fromDate: draftFromDate || undefined,
            toDate: draftToDate || undefined,
            customerName: draftCustomerName || undefined,
        });
        setPage(1);
    }, [draftFromDate, draftToDate, draftCustomerName]);

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
                    <div className="dropdown">
                        <a href="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                            Sort by: {sortOptions.find(o => o.value === sortBy)?.label ?? 'Newest'}
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                            {sortOptions.map((opt) => (
                                <li key={opt.value}>
                                    <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); setSortBy(opt.value); }}>{opt.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Table */}
                <div className="table-responsive table-nowrap">
                    <table className="table mb-0 border">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Token No</th>
                                <th>Type</th>
                                <th>Menus</th>
                                <th>Grand Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-4">No order records found</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.orderNumber}</td>
                                        <td>{formatDate(item.date)}</td>
                                        <td>{item.customerName}</td>
                                        <td>{item.tokenNo}</td>
                                        <td>{item.orderType}</td>
                                        <td>{item.menus}</td>
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
                    <Pagination totalItems={sortedData.length} currentPage={page} onPageChange={setPage} pageSize={PAGE_SIZE} />
                </div>
            </Card.Body>
        </>
    );
};

export default OrderReportTab;
