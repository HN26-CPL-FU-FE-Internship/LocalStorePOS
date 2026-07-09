import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Icon from "../Icon";
import type { StatCardData } from "../../../types";

// Served from the public/ folder, same as the original template's assets/ path.
const orderBg = "/assets/img/bg/order-bg.png";

export interface StatCardProps {
  data: StatCardData;
}

/**
 * One of the four KPI cards in the top row of the dashboard
 * (Total Orders / Total Sales / Average Value / Reservations).
 * Fully data-driven so the same component renders all four variants.
 */
const StatCard = ({ data }: StatCardProps) => {
  const trendVariant = data.change.trend === "up" ? "success" : "danger";

  return (
    <Card className={`z-1 w-100 overflow-hidden bg-${data.color} bg-opacity-0`}>
      <Card.Body className="position-relative">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h4 className="d-inline-flex align-items-center mb-2">
              {data.value}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Badge bg={trendVariant as any} pill className="ms-2 fw-normal">
                {data.change.value}
              </Badge>
            </h4>
            <p className="mb-0">{data.label}</p>
          </div>
          <div
            className={`avatar avatar-lg avatar-rounded bg-${data.color} count-icon border-end border-${data.color} border-2`}
          >
            <Icon name={data.icon} className="fs-24" />
          </div>
        </div>
        <img
          src={orderBg}
          alt="decorative background"
          className="img-fluid position-absolute top-0 end-0 z-n1 custom-line-img"
        />
      </Card.Body>
    </Card>
  );
};

export default StatCard;
