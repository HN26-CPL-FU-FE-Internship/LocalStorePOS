import { memo } from 'react';
import Alert from 'react-bootstrap/Alert';

import ProgressStat from '@/components/common/ProgressStat';
import Skeleton from '@/components/common/Skeleton';
import { DashboardCardShell } from '../common';
import type { TopSellingItem } from '@/types';
import icons from '@/assets/img/icons';
import { getCategoryImageUrl } from '@/api/category.api';

export interface TopSellingCardProps {
    highlightText: string;
    items: TopSellingItem[];
    isLoading?: boolean;
    errorMessage?: string;
}

const loadingSkeleton = (
    <>
        <Skeleton height={38} borderRadius="8px" className="mb-3" />
        <div className="d-flex align-items-center border rounded-3 p-2 mb-3">
            <Skeleton width={56} height={56} borderRadius="50%" className="me-2" />
            <div>
                <Skeleton width={120} height={14} className="mb-2" />
                <Skeleton width={90} height={12} />
            </div>
        </div>
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="d-flex align-items-center justify-content-between mb-3">
                <Skeleton width={100 + i * 8} height={14} />
                <div className="d-flex align-items-center gap-4 w-50">
                    <Skeleton height={8} borderRadius="4px" className="w-100" />
                    <Skeleton width={30} height={14} />
                </div>
            </div>
        ))}
    </>
);

const TopSellingCard = memo(({ highlightText, items, isLoading, errorMessage }: TopSellingCardProps) => {
    const isEmpty = !isLoading && !errorMessage && items.length === 0;
    const [featured, ...ranked] = items;

    return (
        <DashboardCardShell
            icon="donut"
            title="Top Selling Item"
            isLoading={isLoading}
            errorMessage={errorMessage}
            isEmpty={isEmpty}
            emptyMessage="No items data"
            loadingSkeleton={loadingSkeleton}
        >
            {highlightText && (
                <Alert
                    variant="success"
                    className="badge-soft-success text-start d-flex align-items-center text-wrap px-3 py-2 mb-3 border-0 rounded-3"
                >
                    <img src={icons.spark} alt="icon" className="img-fluid me-2" />
                    <span className="fw-medium">{highlightText}</span>
                </Alert>
            )}

            {featured && (
                <div className="top-selling-featured d-flex align-items-center mb-3">
                    <a href="/items" className="avatar avatar-lg avatar-rounded me-2 flex-shrink-0">
                        {featured.imageUrl && (
                            <img src={getCategoryImageUrl(featured.imageUrl)} alt="food" className="img-fluid rounded-circle" />
                        )}
                    </a>
                    <div>
                        <h6 className="fs-14 fw-semibold mb-1">
                            <a href="/items" className="text-decoration-none text-dark">{featured.name}</a>
                        </h6>
                        <p className="fs-13 mb-0 text-muted">
                            No of Orders : <span className="fw-semibold text-dark">{featured.orders}</span>
                        </p>
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
        </DashboardCardShell>
    );
});

export default TopSellingCard;
