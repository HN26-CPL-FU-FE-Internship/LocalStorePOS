import { Dropdown, Tabs, Tab, Button } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';

import Icon from '@/components/common/Icon';
import type { NotificationGroup } from '@/types';

export interface NotificationsDropdownProps {
    groups: NotificationGroup[];
    unreadCount?: number;
    className?: string;
}

const NotificationList = ({ groups }: { groups: NotificationGroup[] }) => (
    <>
        {groups.map((group) => (
            <div className="notification-list" key={group.id}>
                <h6 className="fs-14 fw-semibold mb-3">{group.heading}</h6>
                {group.items.map((item) => (
                    <div className="notification-item" key={item.id}>
                        <div className="d-flex">
                            <div
                                className={`me-2 avatar avatar-rounded flex-shrink-0 badge-soft-${item.variant} border border-${item.variant}`}
                            >
                                <Icon name={item.icon} />
                            </div>
                            <div className="flex-grow-1">
                                <p className="mb-1">{item.message}</p>
                                <p className="fs-13 mb-0 d-inline-flex align-items-center">
                                    <Icon name="clock" className="me-1" />
                                    {item.time}
                                </p>
                                {item.actions && (
                                    <div className="d-flex align-items-center gap-2 mt-2">
                                        {item.actions.map((action) => (
                                            <Button key={action.label} size="sm" variant={action.variant} type="button">
                                                {action.label}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {item.actionable && (
                            <div className="notification-action">
                                <button
                                    type="button"
                                    className="notification-read rounded-circle bg-success border-0 p-0"
                                    title="Mark as Read"
                                    aria-label="Mark as Read"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        ))}
    </>
);

const NotificationsDropdown = ({ groups, unreadCount = 0, className = '' }: NotificationsDropdownProps) => (
    <Dropdown drop="end" autoClose="outside" className={`dropdown ${className}`}>
        <Dropdown.Toggle as="a" href="#" bsPrefix="notification-toggle">
            <Icon name="bell" />
            {unreadCount > 0 && <span className="position-absolute notification-badge bg-danger" />}
        </Dropdown.Toggle>
        <Dropdown.Menu className="dropdown-menu-xl notification-dropdown">
            <div className="d-flex align-items-center justify-content-between notification-header">
                <h5 className="mb-0">Notifications</h5>
                <a href="lorem ipsum" className="link-primary">
                    Mark all as unread
                </a>
            </div>
            <SimpleBar className="notification-body">
                <Tabs defaultActiveKey="all" className="p-1 bg-light rounded border-0 nav-solid-white mb-3">
                    <Tab tabClassName="d-flex align-items-center py-1 px-2" eventKey="all" title="All">
                        <NotificationList groups={groups} />
                    </Tab>
                    <Tab
                        tabClassName="d-flex align-items-center py-1 px-2"
                        eventKey="unread"
                        title={
                            <>
                                Unread <span className="badge-icon ms-1">{unreadCount}</span>
                            </>
                        }
                    >
                        <NotificationList groups={groups} />
                    </Tab>
                    <Tab tabClassName="d-flex align-items-center py-1 px-2" eventKey="inbox" title="Inbox">
                        <NotificationList groups={groups.slice(0, 1)} />
                    </Tab>
                    <Tab
                        tabClassName="d-flex align-items-center py-1 px-2"
                        eventKey="kitchen"
                        title={
                            <>
                                Kitchen <span className="badge-icon ms-1">5</span>
                            </>
                        }
                    >
                        <NotificationList groups={groups} />
                    </Tab>
                    <Tab tabClassName="d-flex align-items-center py-1 px-2" eventKey="order" title="Orders">
                        <NotificationList groups={groups} />
                    </Tab>
                </Tabs>
            </SimpleBar>
        </Dropdown.Menu>
    </Dropdown>
);

export default NotificationsDropdown;
