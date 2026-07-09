import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import StatCard from "../../common/StatCard";
import type { StatCardData } from "../../../types";

export interface StatsRowProps {
  stats: StatCardData[];
}

const StatsRow = ({ stats }: StatsRowProps) => (
  <Row>
    {stats.map((stat) => (
      <Col xl={3} md={6} className="d-flex" key={stat.id}>
        <StatCard data={stat} />
      </Col>
    ))}
  </Row>
);

export default StatsRow;
