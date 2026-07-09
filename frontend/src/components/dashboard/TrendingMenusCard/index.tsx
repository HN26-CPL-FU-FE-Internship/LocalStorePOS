import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import SectionCard from "../../common/SectionCard";
import Icon from "../../common/Icon";
import type { TrendingMenu } from "../../../types";

export interface TrendingMenusCardProps {
  menus: TrendingMenu[];
}

const TrendingMenusCard = ({ menus }: TrendingMenusCardProps) => (
  <SectionCard
    icon="book-text"
    title="Trending Menus"
    filterOptions={[
      { label: "All Items" },
      { label: "Sea Food" },
      { label: "Pizza" },
      { label: "Salads" },
    ]}
    activeFilterLabel="All Items"
  >
    <Row className="g-3">
      {menus.map((menu) => (
        <Col md={4} sm={6} key={menu.id}>
          <div className="border p-3 rounded">
            <div className="text-center mb-3">
              <a href="lorem ipsum">
                <img src={menu.imageUrl} alt="menu" className="img-fluid rounded w-100" />
              </a>
            </div>
            <div>
              <h6 className="fs-14 fw-semibold text-truncate mb-1">
                <a href="lorem ipsum">{menu.name}</a>
              </h6>
              <div className="d-flex align-items-center justify-content-between">
                <p className="mb-0">Orders : {menu.orders}</p>
                <p className="mb-0 d-inline-flex align-items-center">
                  <Icon
                    name="square-dot"
                    className={`me-1 ${menu.dietType === "Veg" ? "text-success" : "text-danger"}`}
                  />
                  {menu.dietType}
                </p>
              </div>
            </div>
          </div>
        </Col>
      ))}
    </Row>
  </SectionCard>
);

export default TrendingMenusCard;
