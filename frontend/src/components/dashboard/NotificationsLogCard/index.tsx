import SectionCard from '@/components/common/SectionCard';
import Icon from '@/components/common/Icon';
import type { ActivityLogGroup } from '@/types';

export interface NotificationsLogCardProps {
    groups: ActivityLogGroup[];
}

const NotificationsLogCard = ({ groups }: NotificationsLogCardProps) => (
    <SectionCard icon="bell" title="Notifications" action={{ label: 'View All', href: 'lorem ipsum' }}>
        {groups.map((group) => (
            <div key={group.id}>
                <h6 className="mb-3">{group.heading}</h6>
                <div className="log-wrap">
                    <div className="position-relative log-item">
                        {group.items.map((item) => (
                            <div key={item.id} className={`d-flex gap-2 flex-sm-row flex-column mb-3`}>
                                <span
                                    className={`avatar avatar-rounded flex-shrink-0 position-relative z-2 badge-soft-${item.color} border border-${item.color}`}
                                >
                                    <Icon name={item.icon} className="fs-16" />
                                </span>
                                <div className="w-100 overflow-hidden">
                                    <p className="text-truncate mb-1">{item.message}</p>
                                    <p className="mb-0 fs-13 d-inline-flex align-items-center">
                                        <Icon name="clock" className="me-1" />
                                        {item.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ))}
    </SectionCard>
);

export default NotificationsLogCard;
