import Icon from '@/components/common/Icon';
import PageHeader from '@/components/common/PageHeader';
import { Button, Card, Col, Nav, Row } from 'react-bootstrap';
import TabContent from './components/TabContent';
import useStatsStatus from '@/hooks/order/useStatsStatus';
import type { OrderQuery, OrderSummary, OrderUpdateStatus } from '@/types';
import useOrderSummary from '@/hooks/order/useOrderSummary';
import { formatDateFilter, formatString } from '@/utils';
import { statsBackgrounds, statsIcons } from '@/constants';
import { useCallback, useMemo, useState } from 'react';
import OrderModal from './components/OrderModal';
import Loading from '@/components/common/Loading';
import TopProgressBar from '@/components/common/TopProgressBar';
import PayOrderModal from './components/PayOrderModal';
import { useUpdateStatus } from '@/hooks/order/';
import HeaderOrders from '@/components/headers/HeaderOrders';

const Orders = () => {
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showOrderPay, setShowOrderPay] = useState(false);
    const [isGrid, setIsGrid] = useState(true);
    const [orderContent, setOrderContent] = useState<OrderSummary | null>(null);
    const [orderQuery, setOrderQuery] = useState<OrderQuery>(() => ({
        page: 0,
        size: 10,
        status: '',
        orderNumber: '',
        fromDate: '2026-01-01',
        toDate: formatDateFilter(Date.now()),
    }));

    const {
        data: stats,
        isLoading: isStatsInitialLoading,
        isFetching: isStatsFetching,
    } = useStatsStatus({
        fromDate: orderQuery.fromDate,
        toDate: orderQuery.toDate,
    });
    const {
        data: summaries,
        isLoading: isSummariesInitialLoading,
        isFetching: isSummariesFetching,
        isError,
    } = useOrderSummary(orderQuery);

    const updateStatusMutate = useUpdateStatus();

    const statsEntries = useMemo(() => Object.entries(stats?.result ?? {}), [stats]);

    const handleActiveButton = useCallback(() => {
        setIsGrid((prev) => !prev);
    }, []);

    const handleOpenOrderModal = useCallback((value: OrderSummary) => {
        setShowOrderModal(true);
        setOrderContent(value);
    }, []);

    const handleCloseOrderModal = useCallback(() => setShowOrderModal(false), []);

    const handleFilterByStatus = useCallback((status: string) => {
        setOrderQuery((prev) => ({
            ...prev,
            status: status === 'total' ? '' : status,
        }));
    }, []);

    const handleDateRangeChange = useCallback((from: Date, to: Date) => {
        console.log('from', formatDateFilter(from.getTime()));
        console.log('to', formatDateFilter(to.getTime()));
        setOrderQuery((prev) => ({
            ...prev,
            fromDate: formatDateFilter(from.getTime()),
            toDate: formatDateFilter(to.getTime()),
        }));
    }, []);

    const handleComplete = (value: OrderUpdateStatus) => {
        updateStatusMutate.mutate(value);
    };
    const handleCancel = (value: OrderUpdateStatus) => {
        updateStatusMutate.mutate(value);
    };
    const handlePay = (value: OrderSummary) => {
        setShowOrderPay(true);
        setOrderContent(value);
    };
    const handlePrint = () => {};

    const isInitialLoading = isStatsInitialLoading || isSummariesInitialLoading;
    const isBackgroundFetching = (isStatsFetching || isSummariesFetching) && !isInitialLoading;

    // Chỉ chặn full màn hình ở LẦN LOAD ĐẦU TIÊN, khi chưa có gì để hiển thị.
    if (isInitialLoading) return <Loading />;
    if (isError) return <div>Error</div>;

    return (
        <>
            <TopProgressBar active={isBackgroundFetching} />
            {/* <PageHeader title="Orders" onDateRangeChange={handleDateRangeChange} /> */}
            <PageHeader title="Orders" action={HeaderOrders({ onDateRangeChange: handleDateRangeChange })} />

            <div style={{ position: 'relative' }}>
                <div
                    style={{
                        opacity: isBackgroundFetching ? 0.5 : 1,
                        pointerEvents: isBackgroundFetching ? 'none' : 'auto',
                        transition: 'opacity 0.15s ease-in-out',
                    }}
                >
                    <Row className="orders-list-four">
                        {statsEntries.map((stat, index) => {
                            if (index === 0) return '';
                            return (
                                <Col xxl={2} lg={4} md={4} sm={6} key={stat[0]}>
                                    <Card>
                                        <Card.Body className="p-3">
                                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                                <div>
                                                    <span className="fs-13 fw-medium mb-1 d-block">
                                                        {formatString(stat[0])}
                                                    </span>
                                                    <h4 className="mb-0">{`${stat[1]}`}</h4>
                                                </div>
                                                <div
                                                    className={`avatar bg-soft-${statsBackgrounds[index - 1]} fs-20 rounded-circle flex-shrink-0`}
                                                >
                                                    <Icon name={statsIcons[index - 1]} />
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 pb-4 mb-4 border-bottom">
                        <Nav as={'ul'} className="nav-tabs nav-tabs-solid border-0" activeKey={orderQuery.status}>
                            {statsEntries.map((stat) => {
                                return (
                                    <Nav.Item as={'li'} key={stat[0]}>
                                        <Nav.Link
                                            as={Button}
                                            eventKey={stat[0] === 'total' ? '' : stat[0]}
                                            onClick={() => handleFilterByStatus(stat[0])}
                                        >
                                            {`${formatString(stat[0])} (${stat[1]})`}
                                        </Nav.Link>
                                    </Nav.Item>
                                );
                            })}
                        </Nav>
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <Button
                                className="btn-sm btn-icon"
                                variant={isGrid ? 'primary' : ''}
                                onClick={handleActiveButton}
                            >
                                <Icon name="grid-2x2" />
                            </Button>
                            <Button
                                className="btn-sm btn-icon"
                                variant={isGrid ? '' : 'primary'}
                                onClick={handleActiveButton}
                            >
                                <Icon name="square-kanban" />
                            </Button>
                            <div className="input-group input-group-flat w-auto">
                                <input className="form-control" placeholder="Search" type="text" />
                                <span className="input-group-text">
                                    <Icon name="search" className="text-dark" />
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="tab-content">
                        <div className="tab-pane show active" id="order-tab1">
                            <Row>
                                {summaries?.result?.content.map((order) => {
                                    return (
                                        <TabContent
                                            key={order.id}
                                            order={order}
                                            actions={{
                                                onClick: handleOpenOrderModal,
                                                onCancel: handleCancel,
                                                onComplete: handleComplete,
                                                onPay: handlePay,
                                                onPrint: handlePrint,
                                            }}
                                        />
                                    );
                                })}
                            </Row>
                        </div>
                    </div>
                </div>
            </div>

            <OrderModal onHide={handleCloseOrderModal} show={showOrderModal} orderContent={orderContent} />
            <PayOrderModal show={showOrderPay} handleClose={() => setShowOrderPay(false)} order={orderContent} />
        </>
    );
};

export default Orders;
