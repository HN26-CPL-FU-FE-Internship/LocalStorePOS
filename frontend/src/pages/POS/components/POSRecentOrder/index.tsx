import { memo, useMemo, useRef, useState } from 'react';
import { Button, Nav, NavItem, NavLink } from 'react-bootstrap';
import type { Swiper as SwiperType } from 'swiper/types';
import { Autoplay } from 'swiper/modules';

import Icon from '@/components/common/Icon';
import { ORDER_FILTERS } from '@/constants';
import { Swiper, SwiperSlide } from 'swiper/react';
import { formatHourAndMinute, toTitleCase } from '@/utils';
import { useRecentOrders } from '@/hooks';

const POSRecentOrder = () => {
    const orderSwiperRef = useRef<SwiperType>(null);

    const [activeOrderFilter, setActiveOrderFilter] = useState('all');
    const { data: ordersPage, isLoading: ordersLoading } = useRecentOrders();

    const orders = useMemo(() => ordersPage?.content ?? [], [ordersPage?.content]);
    const isLoading = ordersLoading;

    /* ---- filtered orders ---- */
    const filteredOrders = useMemo(() => {
        if (activeOrderFilter === 'all') return orders;
        return orders.filter((o) => o.orderType === activeOrderFilter);
    }, [activeOrderFilter, orders]);

    /* ---- order type badge icon ---- */
    const orderTypeIcon = (type: string): string => {
        const map: Record<string, string> = {
            dine_in: 'wine',
            take_away: 'shopping-bag',
            delivery: 'check-check',
        };
        return map[type] ?? 'circle';
    };

    return (
        <div className="slider-wrapper mb-4 pb-4 border-bottom">
            <div className="d-flex align-items-center flex-wrap gap-3 mb-4">
                <h3 className="mb-0">Recent Orders</h3>
                <div className="d-flex align-items-center flex-wrap justify-content-between gap-2 flex-fill">
                    <Nav as={'ul'} className="nav-tabs nav-tabs-solid border-0 align-items-center flex-wrap gap-2">
                        {ORDER_FILTERS.map((f) => (
                            <NavItem as={'li'} key={f.key}>
                                <NavLink
                                    as={Button}
                                    className={`shadow-sm ${activeOrderFilter === f.key ? 'active' : ''}`}
                                    onClick={() => setActiveOrderFilter(f.key)}
                                >
                                    {f.label}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>

                    <div className="d-flex align-items-center gap-2">
                        <Button
                            className="slick-arrow all-prev"
                            variant="default"
                            onClick={() => orderSwiperRef.current?.slidePrev()}
                        >
                            <Icon name="arrow-left" />
                        </Button>
                        <Button
                            className="slick-arrow all-next"
                            variant="default"
                            onClick={() => orderSwiperRef.current?.slideNext()}
                        >
                            <Icon name="arrow-right" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="tab-content">
                <div className="tab-pane fade active show">
                    {isLoading ? (
                        <div className="text-center py-4">
                            <span className="text-muted">Loading recent orders...</span>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-4">
                            <span className="text-muted">No recent orders found</span>
                        </div>
                    ) : (
                        <Swiper
                            modules={[Autoplay]}
                            loop={filteredOrders.length > 3}
                            slidesPerView={3}
                            spaceBetween={5}
                            autoplay={{
                                delay: 2000,
                                disableOnInteraction: false,
                            }}
                            onSwiper={(swiper) => {
                                orderSwiperRef.current = swiper;
                            }}
                            className="mySwiper"
                        >
                            {filteredOrders.map((order) => (
                                <SwiperSlide key={order.id}>
                                    <div className="slide-item">
                                        <div className="order-item">
                                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                                                <div>
                                                    <p className="fs-11 mb-1">{order.orderNumber}</p>
                                                    <h6 className="fs-12 fw-semibold mb-1">{order.customerName}</h6>
                                                    <p className="fs-9 mb-0">
                                                        {formatHourAndMinute(order.orderedAt)}
                                                        <span className="d-inline-block even-line mx-2"></span>
                                                        {order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in'}
                                                    </p>
                                                </div>

                                                <div className="text-end">
                                                    <span className="badge bg-light text-dark d-flex align-items-center mb-3">
                                                        <Icon
                                                            name={orderTypeIcon(order.orderType)}
                                                            className="text-dark me-1"
                                                        />
                                                        {toTitleCase(order.orderType)}
                                                    </span>
                                                    <div className="time badge rounded-pill fs-12 fw-normal bg-success">
                                                        <span className="me-1">
                                                            <Icon name="clock-arrow-up" />
                                                        </span>
                                                        {order.estimatedMinutes ?? '--'} Mins
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-center justify-content-between gap-3">
                                                <div className="progress-item">
                                                    <div
                                                        className={`progress-bar ${
                                                            order.kitchenStatus === 'completed'
                                                                ? 'bg-success'
                                                                : order.kitchenStatus === 'cooking'
                                                                  ? 'bg-warning'
                                                                  : 'bg-secondary'
                                                        }`}
                                                        style={{
                                                            width:
                                                                order.kitchenStatus === 'completed'
                                                                    ? '100%'
                                                                    : order.kitchenStatus === 'cooking'
                                                                      ? '50%'
                                                                      : '10%',
                                                        }}
                                                    ></div>
                                                </div>
                                                <p className="mb-0 fs-10 fw-normal d-flex align-items-center">
                                                    <Icon name="clock" className="me-1" />
                                                    {order.kitchenStatus === 'new_order'
                                                        ? 'Pending'
                                                        : order.kitchenStatus === 'cooking'
                                                          ? `${order.estimatedMinutes ?? '?'}:00`
                                                          : 'Done'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(POSRecentOrder);
