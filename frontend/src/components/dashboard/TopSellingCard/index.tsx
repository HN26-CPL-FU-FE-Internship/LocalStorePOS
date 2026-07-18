import Alert from 'react-bootstrap/Alert';

import SectionCard from '@/components/common/SectionCard';
import ProgressStat from '@/components/common/ProgressStat';
import type { TopSellingItem } from '@/types';
import icons from '@/assets/img/icons';

export interface TopSellingCardProps {
    highlightText: string;
    items: TopSellingItem[];
}

const TopSellingCard = ({ highlightText, items }: TopSellingCardProps) => {
    const [featured, ...ranked] = items;

    return (
        <SectionCard
            icon="donut"
            title="Top Selling Item"
            filterOptions={[{ label: 'All' }, { label: 'Sea Food' }, { label: 'Pizza' }, { label: 'Salads' }]}
            activeFilterLabel="All"
        >
            <Alert
                variant="success"
                className="badge-soft-success text-start d-flex align-items-center text-wrap px-3 py-2 mb-3"
            >
                <img src={icons.spark} alt="icon" className="img-fluid me-2" />
                {highlightText}
            </Alert>

            {featured && (
                <div className="d-flex align-items-center border rounded p-2 mb-3">
                    <a href="lorem ipsum" className="avatar avatar-lg avatar-rounded me-2">
                        {featured.imageUrl && <img src={featured.imageUrl} alt="food" className="img-fluid" />}
                    </a>
                    <div>
                        <h6 className="fs-14 fw-semibold mb-1">
                            <a href="lorem ipsum">{featured.name}</a>
                        </h6>
                        <p className="fs-13 mb-0">No of Orders : {featured.orders}</p>
                    </div>
                </div>
            )}

            {ranked.map((item) => (
                <ProgressStat
                    key={item.id}
                    rank={item.rank}
                    label={item.name}
                    value={item.orders}
                    percent={item.progressPercent}
                    variant={item.color}
                />
            ))}
        </SectionCard>
    );
};

export default TopSellingCard;
