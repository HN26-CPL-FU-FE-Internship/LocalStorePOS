import SectionCard from "../../common/SectionCard";
import ChartPlaceholder from "../../common/ChartPlaceholder";
import Icon from "../../common/Icon";
import type { CategoryStat } from "../../../types";

export interface CategoryStatisticsCardProps {
  stats: CategoryStat[];
}

const CategoryStatisticsCard = ({ stats }: CategoryStatisticsCardProps) => (
  <SectionCard
    icon="croissant"
    title="Category Statistics"
    filterOptions={[{ label: "Weekly" }, { label: "Monthly" }, { label: "Yearly" }]}
    activeFilterLabel="Weekly"
  >
    <ChartPlaceholder id="category-chart" height={220} />

    {stats.map((stat, index) => (
      <div
        key={stat.id}
        className={`d-flex align-items-center justify-content-between p-2 ${
          index < stats.length - 1 ? "border-bottom" : "pb-0"
        }`}
      >
        <div className="d-flex align-items-center">
          <span className={`avatar avatar-sm avatar-rounded bg-${stat.color} me-2`}>
            <Icon name={stat.icon} />
          </span>
          <h6 className="fs-14 fw-medium mb-0">{stat.label}</h6>
        </div>
        <p className="fw-medium mb-0">{stat.orders} Orders</p>
      </div>
    ))}
  </SectionCard>
);

export default CategoryStatisticsCard;
