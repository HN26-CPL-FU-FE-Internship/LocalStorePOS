import { memo } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Icon from '../../common/Icon';
import Skeleton from '@/components/common/Skeleton';
import { DashboardCardShell } from '../common';
import type { TrendingMenu } from '../../../types';
import { getAssetUrl } from '@/lib';
import useAuth from '@/hooks/useAuth';
import { canViewRoute } from '@/utils/navigation';
import { Link } from 'react-router-dom';

export interface TrendingMenusCardProps {
    menus: TrendingMenu[];
    isLoading?: boolean;
    errorMessage?: string;
}

const loadingSkeleton = (
    <Row className="g-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col md={4} sm={6} key={i}>
                <div className="trending-menu-item border-0">
                    <div className="trending-menu-img-wrap">
                        <Skeleton height={130} borderRadius="8px" />
                    </div>
                    <div>
                        <Skeleton width="70%" height={14} className="mb-2" />
                        <div className="d-flex align-items-center justify-content-between">
                            <Skeleton width={60} height={12} />
                            <Skeleton width={50} height={12} />
                        </div>
                    </div>
                </div>
            </Col>
        ))}
    </Row>
);

const TrendingMenusCard = memo(({ menus, isLoading, errorMessage }: TrendingMenusCardProps) => {
    const { canView } = useAuth();
    const canViewItems = canViewRoute('/items', canView);
    const isEmpty = !isLoading && !errorMessage && menus.length === 0;

    return (
        <DashboardCardShell
            icon="book-text"
            title="Trending Menus"
            isLoading={isLoading}
            errorMessage={errorMessage}
            isEmpty={isEmpty}
            emptyMessage="No trending menus"
            loadingSkeleton={loadingSkeleton}
            filterOptions={[{ label: 'All Items' }, { label: 'Sea Food' }, { label: 'Pizza' }, { label: 'Salads' }]}
            activeFilterLabel="All Items"
        >
            <Row className="g-3">
                {menus.map((menu) => (
                    <Col md={4} sm={6} key={menu.id}>
                        <div className="trending-menu-item">
                            <div className="trending-menu-img-wrap">
                                {canViewItems ? (
                                    <Link to="/items">
                                        <img
                                            src={getAssetUrl(menu.imageUrl)}
                                            alt={menu.name}
                                            className="trending-menu-img"
                                        />
                                    </Link>
                                ) : (
                                    <img src={getAssetUrl(menu.imageUrl)} alt={menu.name} className="trending-menu-img" />
                                )}
                            </div>
                            <div>
                                <h6 className="fs-14 fw-semibold text-truncate mb-2">
                                    {canViewItems ? (
                                        <a href="/items" className="text-decoration-none text-dark">
                                            {menu.name}
                                        </a>
                                    ) : (
                                        <span className="text-dark">{menu.name}</span>
                                    )}
                                </h6>
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="fs-12 text-muted fw-medium">Orders : {menu.orders}</span>
                                    <span className="fs-12 d-inline-flex align-items-center gap-1">
                                        <Icon
                                            name="square-dot"
                                            className={menu.dietType === 'Veg' ? 'text-success' : 'text-danger'}
                                            style={{ fontSize: '10px' }}
                                        />
                                        <span className={menu.dietType === 'Veg' ? 'text-success' : 'text-danger'}>
                                            {menu.dietType}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>
        </DashboardCardShell>
    );
});

export default TrendingMenusCard;
