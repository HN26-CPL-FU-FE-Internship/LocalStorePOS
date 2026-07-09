import Icon from '@/components/common/Icon';
import ChartPlaceholder from '@/components/common/ChartPlaceholder';
import SectionCard from '@/components/common/SectionCard';

export interface RevenueCardProps {
    totalRevenue: string;
}

const RevenueCard = ({ totalRevenue }: RevenueCardProps) => (
    <SectionCard
        icon="dollar-sign"
        title="Total Revenue"
        bodyClassName="pb-0"
        filterOptions={[{ label: 'Weekly' }, { label: 'Monthly' }, { label: 'Yearly' }]}
        activeFilterLabel="Weekly"
    >
        <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center">
                <div className="avatar bg-primary me-2">
                    <Icon name="arrow-up" className="fs-20" />
                </div>
                <div>
                    <p className="mb-1">Total Revenue</p>
                    <h4 className="mb-0">{totalRevenue}</h4>
                </div>
            </div>
            <p className="d-inline-flex align-items-center mb-0">
                <Icon name="square" className="text-primary me-1" />
                Revenue
            </p>
        </div>
        <ChartPlaceholder id="revenue-chart" />
    </SectionCard>
);

export default RevenueCard;
