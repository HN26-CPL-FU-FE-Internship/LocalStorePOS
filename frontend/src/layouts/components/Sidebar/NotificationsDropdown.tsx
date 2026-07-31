import { Dropdown, Tabs, Tab, Button } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';

import Icon from '@/components/common/Icon';
import type { NotificationGroup, NotificationItem, BootstrapVariant } from '@/types';

export interface NotificationsDropdownProps {
    groups: NotificationGroup[];
    unreadOnlyGroups: NotificationGroup[];
    unreadCount: number;
    onMarkAsRead: (id: number) => void;
    onMarkAllAsRead: () => void;
    onAcceptAction?: (notificationId: number) => void;
    onDeclineAction?: (notificationId: number) => void;
    isLoading?: boolean;
    isError?: boolean;
    className?: string;
}

/**
 * Keep only the items that match the given predicate, dropping empty groups.
 */
const filterGroups = (
    groups: NotificationGroup[],
    predicate: (item: NotificationItem) => boolean,
): NotificationGroup[] =>
    groups
        .map((group) => ({
            ...group,
            items: group.items.filter(predicate),
        }))
        .filter((group) => group.items.length > 0);

/**
 * Count items in the given groups.
 */
const countItems = (groups: NotificationGroup[]): number => groups.reduce((sum, group) => sum + group.items.length, 0);

/**
 * A kitchen notification is one that mentions kitchen states in its message
 * (e.g. "started cooking", "Ready to serve", "is delayed"). The icon check is
 * deliberately omitted because "New Order" notifications also use the
 * cooking-pot icon but are order events, not kitchen events.
 */ const isKitchenItem = (item: NotificationItem): boolean => {
    const message = item.message?.toString().toLowerCase();
    return Boolean(
        message?.includes('kitchen') ||
        message?.includes('cooking') ||
        message?.includes('ready') ||
        message?.includes('delayed'),
    );
};

const NotificationList = ({
    groups,
    onMarkAsRead,
    onAcceptAction,
    onDeclineAction,
}: {
    groups: NotificationGroup[];
    onMarkAsRead: (id: number) => void;
    onAcceptAction?: (notificationId: number) => void;
    onDeclineAction?: (notificationId: number) => void;
}) => (
    <>
        {groups.length === 0 ? (
            <div className="text-center py-4">
                <Icon name="bell-off" className="fs-3 text-muted mb-2" />
                <p className="text-muted mb-0">No notifications</p>
            </div>
        ) : (
            groups.map((group) => (
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
                                            {item.actions.map((action) => {
                                                const isAccept = action.label.toLowerCase() === 'accept';
                                                return (
                                                    <Button
                                                        key={action.label}
                                                        size="sm"
                                                        variant={action.variant as BootstrapVariant}
                                                        type="button"
                                                        onClick={() => {
                                                            if (isAccept && onAcceptAction) {
                                                                onAcceptAction(parseInt(item.id, 10));
                                                            } else if (!isAccept && onDeclineAction) {
                                                                onDeclineAction(parseInt(item.id, 10));
                                                            }
                                                        }}
                                                    >
                                                        {action.label}
                                                    </Button>
                                                );
                                            })}
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
                                        onClick={() => onMarkAsRead(parseInt(item.id, 10))}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))
        )}
    </>
);

const NotificationsDropdown = ({
    groups,
    unreadOnlyGroups,
    unreadCount = 0,
    onMarkAsRead,
    onMarkAllAsRead,
    onAcceptAction,
    onDeclineAction,
    isLoading = false,
    isError = false,
    className = '',
}: NotificationsDropdownProps) => {
    // Kitchen events are stored with targetType ORDER (via notifyOrderEvent), so
    // exclude them from the Orders tab — they have their own Kitchen tab.
    const orderGroups = filterGroups(groups, (item) => item.targetType === 'ORDER' && !isKitchenItem(item));
    const reservationGroups = filterGroups(groups, (item) => item.targetType === 'RESERVATION');
    const kitchenGroups = filterGroups(groups, isKitchenItem);

    return (
        <Dropdown drop="end" autoClose="outside" className={`dropdown ${className}`}>
            <Dropdown.Toggle as="a" href="#" bsPrefix="notification-toggle">
                <Icon name={isError ? 'bell-off' : 'bell'} />
                {isError && <span className="position-absolute notification-badge bg-warning" />}
                {!isError && unreadCount > 0 && <span className="position-absolute notification-badge bg-danger" />}
            </Dropdown.Toggle>
            <Dropdown.Menu className="dropdown-menu-xl notification-dropdown">
                <div className="d-flex align-items-center justify-content-between notification-header">
                    <h5 className="mb-0">
                        Notifications
                        {unreadCount > 0 && <span className="badge bg-danger ms-2 rounded-pill">{unreadCount}</span>}
                    </h5>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            className="link-primary bg-transparent border-0 text-decoration-underline p-0"
                            onClick={onMarkAllAsRead}
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
                <SimpleBar className="notification-body">
                    {isLoading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <Tabs
                            defaultActiveKey="all"
                            className="p-1 bg-light rounded border-0 nav-solid-white mb-3 d-flex justify-content-between"
                        >
                            <Tab tabClassName="d-flex align-items-center py-1 px-2" eventKey="all" title="All">
                                <NotificationList
                                    groups={groups}
                                    onMarkAsRead={onMarkAsRead}
                                    onAcceptAction={onAcceptAction}
                                    onDeclineAction={onDeclineAction}
                                />
                            </Tab>
                            <Tab
                                tabClassName="d-flex align-items-center py-1 px-2"
                                eventKey="unread"
                                title={
                                    <>
                                        Unread{' '}
                                        {unreadCount > 0 && <span className="badge-icon ms-1">{unreadCount}</span>}
                                    </>
                                }
                            >
                                <NotificationList
                                    groups={unreadOnlyGroups}
                                    onMarkAsRead={onMarkAsRead}
                                    onAcceptAction={onAcceptAction}
                                    onDeclineAction={onDeclineAction}
                                />
                            </Tab>
                            <Tab
                                tabClassName="d-flex align-items-center py-1 px-2"
                                eventKey="kitchen"
                                title={
                                    <>
                                        Kitchen <span className="badge-icon ms-1">{countItems(kitchenGroups)}</span>
                                    </>
                                }
                            >
                                <NotificationList
                                    groups={kitchenGroups}
                                    onMarkAsRead={onMarkAsRead}
                                    onAcceptAction={onAcceptAction}
                                    onDeclineAction={onDeclineAction}
                                />
                            </Tab>
                            <Tab
                                tabClassName="d-flex align-items-center py-1 px-2"
                                eventKey="order"
                                title={
                                    <>
                                        Orders <span className="badge-icon ms-1">{countItems(orderGroups)}</span>
                                    </>
                                }
                            >
                                <NotificationList
                                    groups={orderGroups}
                                    onMarkAsRead={onMarkAsRead}
                                    onAcceptAction={onAcceptAction}
                                    onDeclineAction={onDeclineAction}
                                />
                            </Tab>
                            <Tab
                                tabClassName="d-flex align-items-center py-1 px-2"
                                eventKey="reservation"
                                title={
                                    <>
                                        Reservations{' '}
                                        <span className="badge-icon ms-1">{countItems(reservationGroups)}</span>
                                    </>
                                }
                            >
                                <NotificationList
                                    groups={reservationGroups}
                                    onMarkAsRead={onMarkAsRead}
                                    onAcceptAction={onAcceptAction}
                                    onDeclineAction={onDeclineAction}
                                />
                            </Tab>
                        </Tabs>
                    )}
                </SimpleBar>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default NotificationsDropdown;
