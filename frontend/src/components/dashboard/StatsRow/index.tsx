import { memo } from 'react';
import { Col, Row } from 'react-bootstrap';

import { orderBg } from '@/assets/img/bg';
import Skeleton from '@/components/common/Skeleton';
import StatCard from '@/components/common/StatCard';
import type { StatCardData } from '@/types';

export interface StatsRowProps {
    stats: StatCardData[];
    isLoading?: boolean;
    errorMessage?: string;
}

const StatsRow = memo(({ stats, isLoading, errorMessage }: StatsRowProps) => {
    if (isLoading) {
        return (
            <Row className="dashboard-stats-row g-3 mb-4">
                {[1, 2, 3, 4].map((i) => (
                    <Col xl={3} md={6} className="d-flex" key={i}>
                        <div className="stat-card-wrap w-100">
                            <div className="card border-0 shadow-sm w-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center gap-3">
                                        <Skeleton width={48} height={48} borderRadius="12px" className="flex-shrink-0" />
                                        <div className="flex-grow-1">
                                            <Skeleton width="60%" height={14} className="mb-2" />
                                            <Skeleton width="40%" height={28} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>
        );
    }

    if (errorMessage) {
        return (
            <Row className="mb-4">
                <Col xs={12}>
                    <div className="alert alert-danger text-center rounded-3 shadow-sm border-0">{errorMessage}</div>
                </Col>
            </Row>
        );
    }

    return (
        <Row className="dashboard-stats-row g-3 mb-4">
            {stats.map((stat) => (
                <Col xl={3} md={6} className="d-flex" key={stat.id}>
                    <div className="stat-card-wrap w-100">
                        <StatCard data={stat} background={orderBg} />
                    </div>
                </Col>
            ))}
        </Row>
    );
});

export default StatsRow;
