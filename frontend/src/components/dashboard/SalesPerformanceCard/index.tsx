import Badge from "react-bootstrap/Badge";
import SectionCard from "../../common/SectionCard";
import ChartPlaceholder from "../../common/ChartPlaceholder";
import Icon from "../../common/Icon";
import type { SalesSummaryItem } from "../../../types";

export interface SalesPerformanceCardProps {
  summary: SalesSummaryItem[];
}

const SalesPerformanceCard = ({ summary }: SalesPerformanceCardProps) => (
  <SectionCard
    icon="chart-column-stacked"
    title="Sales Performance"
    action={{ label: "View All", href: "lorem ipsum" }}
  >
    <ChartPlaceholder id="sales-chart" height={220} className="mb-xl-4 mb-3" />

    {summary.map((item, index) => (
      <div
        key={item.id}
        className={`d-flex align-items-center justify-content-between border rounded position-relative p-2 z-1 overflow-hidden ${
          index < summary.length - 1 ? "mb-3" : "mb-0"
        }`}
      >
        <div className="d-flex align-items-center">
          <span className={`avatar avatar-md avatar-rounded bg-${item.color} me-2`}>
            <Icon name={item.icon} className="fs-16" />
          </span>
          <div>
            <p className="mb-1">{item.label}</p>
            <h6 className="mb-0">{item.value}</h6>
          </div>
        </div>
        <Badge bg="success" pill>
          {item.change}
        </Badge>
        <img
          src="/assets/img/bg/sale-bg.png"
          alt="decorative background"
          className="img-fluid z-n1 position-absolute start-0 top-0 custom-line-img"
        />
      </div>
    ))}
  </SectionCard>
);

export default SalesPerformanceCard;
