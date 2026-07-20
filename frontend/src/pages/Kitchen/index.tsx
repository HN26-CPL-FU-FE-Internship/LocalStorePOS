import { useCallback, useState } from 'react';
import Loading from '@/components/common/Loading';
import PageHeader from '@/components/common/PageHeader';
import HeaderKitchen from '@/components/HeaderKitchen';
import useStatsKitchenStatus from '@/hooks/kitchen/useStatsKitchenStatus';
import { Row } from 'react-bootstrap';
import OrderKitchenCard from './components/OrderKitchenCard';
import useKitchenOrder, { PAGE_SIZE } from '@/hooks/kitchen/useKitchenOrder';
import TopProgressBar from '@/components/common/TopProgressBar';
import Fetching from '@/components/common/Fetching';
import Pagination from '@/components/common/Pagination';

const Kitchen = () => {
    const [currentPage, setCurrentPage] = useState(1);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

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
    } = useKitchenOrder(currentPage);

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
