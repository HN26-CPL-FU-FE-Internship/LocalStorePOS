import { Col, Row } from 'react-bootstrap';

import { orderBg } from '@/assets/img/bg';
import StatCard from '@/components/common/StatCard';
import type { StatCardData } from '@/types';

export interface StatsRowProps {
    stats: StatCardData[];
}

const StatsRow = ({ stats }: StatsRowProps) => {
    return (
        <Row>
            {stats.map((stat) => (
                <Col xl={3} md={6} className="d-flex" key={stat.id}>
                    <StatCard data={stat} background={orderBg} />
                </Col>
            ))}
        </Row>
    );
};

export default StatsRow;
