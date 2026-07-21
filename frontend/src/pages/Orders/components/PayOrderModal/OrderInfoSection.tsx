import { toTitleCase } from '@/utils';
import type { OrderSummary } from '@/types';

const OrderInfoSection = ({ order }: { order: OrderSummary }) => (
    <div className="mb-3 pb-3 border-bottom">
        <h5 className="mb-3 fs-16">Order Info</h5>
        <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
            Order No <span className="fw-medium text-dark">{order.orderNumber}</span>
        </h6>
        <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3">
            No of Items <span className="fw-medium text-dark">{order.items.length}</span>
        </h6>
        <h6 className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-0">
            Order Type
            <span className="fw-medium text-dark">
                {toTitleCase(order.orderType)}
                {order.tableNumber ? ` (Table ${order.tableNumber})` : ''}
            </span>
        </h6>
    </div>
);

export default OrderInfoSection;
