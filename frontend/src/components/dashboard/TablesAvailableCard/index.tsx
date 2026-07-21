import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import SectionCard from "../../common/SectionCard";
import type { TableAvailability } from "../../../types";

export interface TablesAvailableCardProps {
  tables: TableAvailability[];
}

const TablesAvailableCard = ({ tables }: TablesAvailableCardProps) => (
  <SectionCard
    icon="concierge-bell"
    title="Tables Available"
    action={{ label: "View All", href: "lorem ipsum" }}
  >
    <Row className="g-3">
      {tables.map((table) => (
        <Col sm={6} className="d-flex" key={table.id}>
          <div className="border p-3 rounded w-100 d-flex align-items-center justify-content-center">
            <div className="position-relative text-center">
              <img src={table.imageUrl} alt="table" className="img-fluid custom-line-img" />
              <div className="position-absolute top-50 start-50 w-100 translate-middle text-center">
                <h6 className="fs-12 fw-semibold mb-1">{table.name}</h6>
                <p className="fs-12 mb-0">Guests : {table.guests}</p>
              </div>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  </SectionCard>
);

export default TablesAvailableCard;
