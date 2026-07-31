import { memo } from 'react';
import Skeleton from '@/components/common/Skeleton';
import Icon from '@/components/common/Icon';
import { DashboardCardShell } from '../common';
import type { ActivityLogResponse } from '@/api/dashboard.api';

export interface NotificationsLogCardProps {
    groups: ActivityLogResponse[];
    isLoading?: boolean;
    errorMessage?: string;
}

const loadingSkeleton = (
    <div className="d-flex flex-column gap-3 py-2">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="d-flex gap-3 align-items-start">
                <Skeleton width={36} height={36} borderRadius="50%" className="flex-shrink-0" />
                <div className="flex-grow-1">
                    <Skeleton width="80%" height={12} className="mb-2" />
                    <Skeleton width="50%" height={10} />
                </div>
            </div>
        ))}
    </div>
);

const NotificationsLogCard = memo(({ groups, isLoading, errorMessage }: NotificationsLogCardProps) => {
    const isEmpty = !isLoading && !errorMessage && groups.length === 0;

    return (
        <DashboardCardShell
            icon="bell"
            title="Notifications"
            isLoading={isLoading}
            errorMessage={errorMessage}
            isEmpty={isEmpty}
            emptyMessage="No recent activity"
            loadingSkeleton={loadingSkeleton}
            action={{ label: 'View All', href: '/reports/audit-report' }}
        >
            <div className="notification-timeline">
                {groups.map((group) => (
                    <div key={group.heading} className="mb-3">
                        <h6 className="fs-12 fw-semibold text-muted text-uppercase mb-2 px-1">{group.heading}</h6>
                        {group.items.map((item) => (
                            <div key={item.id} className="notification-item">
                                <span
                                    className={`avatar avatar-rounded flex-shrink-0 d-flex align-items-center justify-content-center badge-soft-${item.color}`}
                                    style={{ width: 36, height: 36 }}
                                >
                                    <Icon name={item.icon} className="fs-14" />
                                </span>
                                <div className="w-100 overflow-hidden">
                                    <p className="text-truncate mb-1 fs-13">{item.message}</p>
                                    <p className="mb-0 fs-12 d-inline-flex align-items-center text-muted gap-1">
                                        <Icon name="clock" style={{ fontSize: '10px' }} />
                                        {item.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </DashboardCardShell>
    );
});

export default NotificationsLogCard;
