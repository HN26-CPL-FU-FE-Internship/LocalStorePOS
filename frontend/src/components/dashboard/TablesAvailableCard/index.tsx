import { memo } from 'react';
import Skeleton from '@/components/common/Skeleton';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { DashboardCardShell } from '../common';
import type { TableAvailability } from '../../../types';

export interface TablesAvailableCardProps {
    tables: TableAvailability[];
    isLoading?: boolean;
    errorMessage?: string;
}

const loadingSkeleton = (
    <Row className="g-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col sm={6} key={i}>
                <div className="table-available-item">
                    <Skeleton height={72} className="mb-2" borderRadius="8px" />
                    <Skeleton width="60%" height={14} className="mx-auto mb-1" />
                    <Skeleton width="40%" height={12} className="mx-auto" />
                </div>
            </Col>
        ))}
    </Row>
);

const TablesAvailableCard = memo(({ tables, isLoading, errorMessage }: TablesAvailableCardProps) => {
    const isEmpty = !isLoading && !errorMessage && tables.length === 0;

    return (
        <DashboardCardShell
            icon="concierge-bell"
            title="Tables Available"
            isLoading={isLoading}
            errorMessage={errorMessage}
            isEmpty={isEmpty}
            emptyMessage="No available tables"
            loadingSkeleton={loadingSkeleton}
            action={{ label: 'View All', href: '/tables' }}
        >
            <Row className="g-3">
                {tables.map((table) => (
                    <Col sm={6} className="d-flex" key={table.id}>
                        <div className="table-available-item w-100">
                            <div className="table-icon-wrap">
                                <img src={table.imageUrl} alt="table" className="img-fluid" style={{ maxHeight: 72 }} />
                            </div>
                            <h6 className="fs-13 fw-semibold mb-1">{table.name}</h6>
                            <p className="fs-12 text-muted mb-0">
                                Guests : <span className="fw-medium text-dark">{table.guests}</span>
                            </p>
                        </div>
                    </Col>
                ))}
            </Row>{' '}
        </DashboardCardShell>
    );
});

export default TablesAvailableCard;
