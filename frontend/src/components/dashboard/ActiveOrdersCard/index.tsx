import { memo } from 'react';
import Badge from 'react-bootstrap/Badge';
import Skeleton from '@/components/common/Skeleton';
import Icon from '../../common/Icon';
import { DashboardCardShell } from '../common';
import type { ActiveOrder } from '../../../types';
import { Link } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import { getCategoryImageUrl } from '@/api/category.api';

export interface ActiveOrdersCardProps {
    orders: ActiveOrder[];
    isLoading?: boolean;
    errorMessage?: string;
}

const loadingSkeleton = (
    <>
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center">
                    <Skeleton width={40} height={40} borderRadius="50%" className="me-2" />
                    <div>
                        <Skeleton width={100 + i * 6} height={14} className="mb-2" />
                        <Skeleton width={80 + i * 4} height={12} />
                    </div>
                </div>
                <Skeleton width={60} height={22} borderRadius="12px" />
            </div>
        ))}
    </>
);

const ActiveOrdersCard = memo(({ orders, isLoading, errorMessage }: ActiveOrdersCardProps) => {
    const isEmpty = !isLoading && !errorMessage && orders.length === 0;

    return (
        <DashboardCardShell
            icon="shopping-cart"
            title="Active Orders"
            isLoading={isLoading}
            errorMessage={errorMessage}
            isEmpty={isEmpty}
            emptyMessage="No active orders"
            loadingSkeleton={loadingSkeleton}
            action={{ label: 'Add New', href: '/orders' }}
        >
            {orders.map((order) => (
                <div
                    key={order.id}
                    className="active-order-item d-flex align-items-sm-center justify-content-between gap-2 flex-column flex-sm-row mb-2"
                >
                    <div className="d-flex align-items-center gap-2">
                        <div
                            className="avatar avatar-rounded flex-shrink-0 bg-light border d-flex align-items-center justify-content-center"
                            style={{ width: 40, height: 40 }}
                        >
                            {order.avatarUrl ? (
                                <Image
                                    src={getCategoryImageUrl(order.avatarUrl)}
                                    alt="customer"
                                    className="img-fluid rounded-circle"
                                />
                            ) : (
                                <Icon name="users-round" className="fs-16 text-muted" />
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <h6 className="fs-13 fw-semibold mb-1 text-truncate">{order.customerName}</h6>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="fs-12 text-muted">{order.type}</span>
                                {order.tableNo && (
                                    <>
                                        <span className="text-muted">|</span>
                                        <span className="fs-12 text-muted">Table : {order.tableNo}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <Badge bg="" className={`badge-soft-${order.statusVariant} badge-dashboard`}>
                            {order.status}
                        </Badge>
                    </div>
                </div>
            ))}

            <Link to={'/orders'} type="button" className="btn view-all-btn mt-2">
                View All Orders
            </Link>
        </DashboardCardShell>
    );
});

export default ActiveOrdersCard;
