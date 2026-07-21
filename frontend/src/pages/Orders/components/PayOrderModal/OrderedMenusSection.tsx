import type { OrderItem } from '@/types/order';

const OrderedMenusSection = ({ items }: { items: OrderItem[] }) => (
    <div className="mb-3 pb-3 border-bottom orders-list">
        <h5 className="mb-3 fs-16">Ordered Menus</h5>
        {items.map((item) => (
            <h6
                key={item.id ?? item.itemName}
                className="fs-14 fw-normal d-flex align-items-center justify-content-between mb-3 orders-two"
            >
                {item.itemName} ×{item.quantity} <span className="line"></span>
                <span className="fw-medium text-dark">${item.unitPrice * item.quantity}</span>
            </h6>
        ))}
    </div>
);

export default OrderedMenusSection;
