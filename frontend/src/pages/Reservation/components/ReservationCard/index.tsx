import type { ReservationEntry } from '@/api/table.api';
import Icon from '@/components/common/Icon';
import { formatDateTimeKitchen, formatHourAndMinute2, formatMonthDay, formatString } from '@/utils';
import { getYear } from 'date-fns';
import { Badge, Card, Col } from 'react-bootstrap';

const reservationBadgeClass: Record<string, string> = {
    booked: 'badge-soft-success',
    seated: 'badge-soft-warning',
    completed: 'badge-soft-info',
    cancelled: 'badge-soft-danger',
    paid: 'badge-soft-purple',
};
const ReservationCard = ({ reservation }: { reservation: ReservationEntry }) => {
    return (
        <Col xxl={4} xl={6} sm={6}>
            <Card>
                <Card.Body>
                    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                        <div className="bg-dark reservation-date rounded p-2 text-center flex-shrink-0">
                            <p className="text-white fw-semibold mb-0 position-relative">
                                {formatMonthDay(reservation.reservationTime)}{' '}
                                <span className="fs-13 fw-normal d-block mt-1">
                                    {getYear(reservation.reservationTime)}
                                </span>
                            </p>
                        </div>
                        <div>
                            <h6 className="mb-2 fw-semibold">{reservation.customerName}</h6>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <p className="d-flex align-items-center mb-0">
                                    <Icon name="clock" className="me-1 text-dark me-1" />
                                    {formatHourAndMinute2(reservation.reservationTime)}
                                </p>
                                <span className="even-line"></span>
                                <p className="d-flex align-items-center mb-0">
                                    <Icon name="sofa" className="text-dark me-1" /> Table : {reservation.tableNumber}
                                </p>
                                <span className="even-line"></span>
                                <p className="d-flex align-items-center mb-0">
                                    <Icon name="users-round" className="text-dark me-1" />
                                    Guests : {reservation.guests}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mb-3 pb-3 border-bottom-dashed">
                        <p className="mb-3 d-flex align-items-center justify-content-between gap-2 flex-wrap">
                            Created on <span className="text-dark">{formatDateTimeKitchen(reservation.createdAt)}</span>
                        </p>
                        <p className="mb-0 d-flex align-items-center justify-content-between gap-2 flex-wrap">
                            Status{' '}
                            <Badge bg="" className={reservationBadgeClass[reservation.status] || 'badge-soft-primary'}>
                                {formatString(reservation.status)}
                            </Badge>
                        </p>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );
};

export default ReservationCard;
