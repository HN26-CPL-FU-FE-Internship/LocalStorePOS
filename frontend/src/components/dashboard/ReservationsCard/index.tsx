import { memo } from 'react';
import Badge from 'react-bootstrap/Badge';
import Skeleton from '@/components/common/Skeleton';
import Icon from '../../common/Icon';
import { DashboardCardShell } from '../common';
import type { DashboardReservationResponse } from '@/api/dashboard.api';

export interface ReservationsCardProps {
    reservations: DashboardReservationResponse[];
    isLoading?: boolean;
    errorMessage?: string;
}

const loadingSkeleton = (
    <div className="d-flex flex-column gap-3 py-3">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="d-flex align-items-center gap-3">
                <Skeleton width={56} height={56} borderRadius="10px" className="flex-shrink-0" />
                <div className="flex-grow-1">
                    <Skeleton width="60%" height={14} className="mb-2" />
                    <Skeleton width="40%" height={12} />
                </div>
            </div>
        ))}
    </div>
);

const ReservationsCard = memo(({ reservations, isLoading, errorMessage }: ReservationsCardProps) => {
    const isEmpty = !isLoading && !errorMessage && reservations.length === 0;

    return (
        <DashboardCardShell
            icon="file-clock"
            title="Reservations"
            bodyClassName="pb-1"
            isLoading={isLoading}
            errorMessage={errorMessage}
            isEmpty={isEmpty}
            emptyMessage="No upcoming reservations"
            loadingSkeleton={loadingSkeleton}
            filterOptions={[
                { label: 'All Orders' },
                { label: 'Pending' },
                { label: 'In Progress' },
                { label: 'Completed' },
                { label: 'Cancelled' },
            ]}
            activeFilterLabel="All Orders"
        >
            {reservations.map((reservation) => (
                <div key={reservation.id} className="reservation-item">
                    <div className="reservation-date-block">
                        <p className="text-white fw-bold mb-0 fs-14 lh-1">
                            {reservation.day}
                            <span className="fs-11 fw-normal d-block mt-1 opacity-75">{reservation.year}</span>
                        </p>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                        <h6 className="mb-1 fw-semibold fs-13 text-truncate">{reservation.customerName}</h6>
                        <div className="d-flex align-items-center flex-wrap gap-2">
                            <span className="d-inline-flex align-items-center gap-1 fs-12 text-muted">
                                <Icon name="clock" style={{ fontSize: '11px' }} />
                                {reservation.time}
                            </span>
                            <span className="text-muted" style={{ fontSize: '8px' }}>|</span>
                            <span className="d-inline-flex align-items-center gap-1 fs-12 text-muted">
                                <Icon name="sofa" style={{ fontSize: '11px' }} />
                                {reservation.tables} Table
                            </span>
                            <span className="text-muted" style={{ fontSize: '8px' }}>|</span>
                            <span className="d-inline-flex align-items-center gap-1 fs-12 text-muted">
                                <Icon name="users-round" style={{ fontSize: '11px' }} />
                                {reservation.guests}
                            </span>
                        </div>
                    </div>
                    <Badge bg="" className={`badge-soft-${reservation.statusVariant} badge-dashboard flex-shrink-0`}>
                        {reservation.status}
                    </Badge>
                </div>
            ))}
        </DashboardCardShell>
    );
});

export default ReservationsCard;
