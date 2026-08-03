import { useCallback, useState, type ChangeEvent } from 'react';
import Loading from '@/components/common/Loading';
import PageHeader from '@/components/common/PageHeader';
import HeaderKitchen from '@/components/HeaderKitchen';
import Icon from '@/components/common/Icon';
import useStatsKitchenStatus from '@/hooks/kitchen/useStatsKitchenStatus';
import { Form, Row } from 'react-bootstrap';
import OrderKitchenCard from './components/OrderKitchenCard';
import useKitchenOrder, { PAGE_SIZE } from '@/hooks/kitchen/useKitchenOrder';
import TopProgressBar from '@/components/common/TopProgressBar';
import Fetching from '@/components/common/Fetching';
import Pagination from '@/components/common/Pagination';
import useDebounce from '@/hooks/useDebounce';
import { KITCHEN_STATUSES } from '@/constants';
import type { KitchenStatus } from '@/types';
import { toTitleCase } from '@/utils';

const Kitchen = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<KitchenStatus | ''>('');
    const debouncedSearch = useDebounce(search.trim(), 800);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setStatus(e.target.value as KitchenStatus | '');
        setCurrentPage(1);
    };

    const {
        data: stats,
        isLoading: statsLoading,
        isFetching: statsFetching,
        error: statsError,
    } = useStatsKitchenStatus();
    const {
        data: kitchenOrders,
        isLoading: orderLoading,
        isFetching: orderFetching,
        error: orderError,
    } = useKitchenOrder(currentPage, debouncedSearch, status);

    const isInitialLoading = statsLoading || orderLoading;
    const isBackgroundFetching = (statsFetching || orderFetching) && !isInitialLoading;

    if (isInitialLoading) return <Loading />;
    if (statsError || orderError) return <div>Error</div>;

    const orders = kitchenOrders?.result?.content ?? [];
    const totalItems = kitchenOrders?.result?.totalElements ?? 0;

    return (
        <>
            <TopProgressBar active={isBackgroundFetching} />
            <Fetching isBackgroundFetching={isBackgroundFetching}>
                <PageHeader title="Kitchen" action={<HeaderKitchen data={stats?.result} />} />

                <div className="d-flex align-items-center justify-content-end flex-wrap gap-2 mb-4">
                    <Form.Select
                        className="w-auto"
                        value={status}
                        onChange={handleStatusChange}
                        aria-label="Filter by kitchen status"
                    >
                        <option value="">All Statuses</option>
                        {(Object.keys(KITCHEN_STATUSES) as KitchenStatus[]).map((kitchenStatus) => (
                            <option key={kitchenStatus} value={kitchenStatus}>
                                {toTitleCase(kitchenStatus)}
                            </option>
                        ))}
                    </Form.Select>
                    <div className="input-group input-group-flat w-auto">
                        <input
                            className="form-control"
                            placeholder="Search order, token, table or customer"
                            type="text"
                            value={search}
                            onChange={handleSearch}
                        />
                        <span className="input-group-text">
                            <Icon name="search" className="text-dark" />
                        </span>
                    </div>
                </div>

                <Row className="g-4">
                    {orders.map((order) => (
                        <OrderKitchenCard order={order} key={order.id} />
                    ))}
                </Row>

                <div className="mt-4">
                    <Pagination totalItems={totalItems} currentPage={currentPage} onPageChange={handlePageChange} pageSize={PAGE_SIZE} />
                </div>
            </Fetching>
        </>
    );
};

export default Kitchen;
