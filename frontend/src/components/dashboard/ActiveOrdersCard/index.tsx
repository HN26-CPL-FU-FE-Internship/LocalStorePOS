import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import SectionCard from "../../common/SectionCard";
import Icon from "../../common/Icon";
import type { ActiveOrder } from "../../../types";

export interface ActiveOrdersCardProps {
  orders: ActiveOrder[];
}

const ActiveOrdersCard = ({ orders }: ActiveOrdersCardProps) => (
  <SectionCard icon="shopping-cart" title="Active Orders" action={{ label: "Add New", href: "lorem ipsum" }}>
    {orders.map((order) => (
      <div
        key={order.id}
        className="d-flex align-items-sm-center justify-content-between gap-2 flex-column flex-sm-row mb-3"
      >
        <div className="d-flex align-items-center">
          <div className="avatar avatar-rounded me-2 bg-light border">
            {order.avatarUrl ? (
              <img src={order.avatarUrl} alt="customer" className="img-fluid" />
            ) : (
              <Icon name="users-round" className="fs-16 text-dark" />
            )}
          </div>
          <div className="overflow-hidden">
            <h6 className="fs-14 fw-semibold mb-1">{order.customerName}</h6>
            <div className="d-flex align-items-center gap-2">
              <p className="mb-0">{order.type}</p>
              {order.tableNo && (
                <>
                  <span className="even-line" />
                  <p className="mb-0">Table No : {order.tableNo}</p>
                </>
              )}
            </div>
          </div>
        </div>
        <div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Badge bg={order.statusVariant as any} className={`badge-soft-${order.statusVariant}`}>
            {order.status}
          </Badge>
        </div>
      </div>
    ))}

    <Button variant="secondary" size="sm" href="lorem ipsum" className="w-100">
      View All
    </Button>
  </SectionCard>
);

export default ActiveOrdersCard;
