import Badge from "react-bootstrap/Badge";
import SectionCard from "../../common/SectionCard";
import Icon from "../../common/Icon";
import type { ReservationItem } from "../../../types";

export interface ReservationsCardProps {
  reservations: ReservationItem[];
}

const ReservationsCard = ({ reservations }: ReservationsCardProps) => (
  <SectionCard
    icon="file-clock"
    title="Reservations"
    bodyClassName="pb-1"
    filterOptions={[
      { label: "All Orders" },
      { label: "Pending" },
      { label: "In Progress" },
      { label: "Completed" },
      { label: "Cancelled" },
    ]}
    activeFilterLabel="All Orders"
  >
    {reservations.map((reservation) => (
      <div
        key={reservation.id}
        className="d-flex align-items-sm-center flex-column flex-sm-row gap-2 mb-3"
      >
        <div className="d-flex align-items-center gap-2 flex-fill">
          <div className="bg-dark reservation-date rounded p-2 text-center flex-shrink-0">
            <p className="text-white fw-semibold mb-0 position-relative">
              {reservation.day}
              <span className="fs-13 fw-normal d-block mt-1">{reservation.year}</span>
            </p>
          </div>
          <div>
            <h6 className="mb-2 fw-semibold text-truncate">{reservation.customerName}</h6>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <p className="d-flex align-items-center mb-0">
                <Icon name="clock" className="me-1 text-dark" />
                {reservation.time}
              </p>
              <span className="even-line" />
              <p className="d-flex align-items-center mb-0">
                <Icon name="sofa" className="me-1 text-dark" />
                {reservation.tables}
              </p>
              <span className="even-line" />
              <p className="d-flex align-items-center mb-0">
                <Icon name="users-round" className="me-1 text-dark" />
                {reservation.guests}
              </p>
            </div>
          </div>
        </div>
        <div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Badge bg={reservation.statusVariant as any} className={`badge-soft-${reservation.statusVariant}`}>
            {reservation.status}
          </Badge>
        </div>
      </div>
    ))}
  </SectionCard>
);

export default ReservationsCard;
