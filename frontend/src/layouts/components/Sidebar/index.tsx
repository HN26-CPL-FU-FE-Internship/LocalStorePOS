import { useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Icon from '@/components/common/Icon';
import IconRail from './IconRail';
import SidebarMenu from './SidebarMenu';
import NotificationsDropdown from './NotificationsDropdown';
import ProfileDropdown from './ProfileDropdown';
import StoreSwitcherDropdown from './StoreSwitcherDropdown';
import { sidebarTabs, storeOptions, profileMenuItems } from '@/data/navigationData';
import { useNotifications } from '@/hooks';
import useAuth from '@/hooks/useAuth';
import { filterSidebarTabs } from '@/utils/navigation';
import { Link, useLocation } from 'react-router-dom';
import configs from '@/configs';
import logoSmall from '@/assets/img/logo-small.svg';

export interface SidebarProps {
    onClose: () => void;
}

/**
 * Equivalent of <div class="two-col-sidebar"> ... </div>.
 * Manual tab-state (rather than react-bootstrap's <Tab.Container>) because the
 * icon rail (left) and the menu panel (right) are two independent, visually
 * separated regions driven by the same "active tab" state.
 */
const Sidebar = ({ onClose }: SidebarProps) => {
    const [activeStoreId, setActiveStoreId] = useState(storeOptions[0].id);
    const { canView } = useAuth();

    const { pathname } = useLocation();

    // Tabs the current role can actually use (at least one viewable item).
    const visibleTabs = useMemo(() => filterSidebarTabs(sidebarTabs, canView), [canView]);

    // If the tab for the current route is not visible to this role, fall back
    // to the first visible tab so the icon rail never highlights a hidden tab.
    const [activeTab, setActiveTab] = useState(() => {
        const current = sidebarTabs.find((tab) => tab.endpoints.includes(pathname));
        if (current && visibleTabs.some((tab) => tab.id === current.id)) {
            return current;
        }
        return visibleTabs[0] ?? sidebarTabs[0];
    });

    const {
        groups: allGroups,
        unreadGroups,
        unreadCount,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        acceptAction,
        declineAction,
        isLoading,
        isError,
    } = useNotifications();

    return (
        <div className="two-col-sidebar" id="two-col-sidebar">
            <div className="sidebar sidebar-twocol">
                <div className="twocol-mini">
                    <Link to={configs.routes.dashboard} className="logo-small">
                        <img src={logoSmall} alt="Logo" />
                    </Link>

                    <div className="sidebar-left">
                        <IconRail tabs={visibleTabs} activeTabId={activeTab.id} onSelectTab={setActiveTab} />

                        <div className="sidebar-profile ">
                            <NotificationsDropdown
                                groups={allGroups}
                                unreadOnlyGroups={unreadGroups}
                                unreadCount={unreadCount}
                                onMarkAsRead={markAsRead}
                                onMarkAsUnread={markAsUnread}
                                onMarkAllAsRead={markAllAsRead}
                                onAcceptAction={acceptAction}
                                onDeclineAction={declineAction}
                                isLoading={isLoading}
                                isError={isError}
                            />
                            <ProfileDropdown menuItems={profileMenuItems} />
                        </div>
                    </div>
                </div>

                <div className="sidebar-right">
                    <div className="sidebar-logo mb-3 d-flex align-items-center justify-content-between">
                        <StoreSwitcherDropdown
                            stores={storeOptions}
                            activeStoreId={activeStoreId}
                            onSelectStore={setActiveStoreId}
                        />

                        <Button
                            variant="link"
                            className="sidenav-toggle-btn border-0 p-0"
                            id="toggle_btn"
                            aria-label="collapse sidebar"
                            onClick={onClose}
                        >
                            <Icon name="panel-right-open" className="fs-16" />
                        </Button>

                        <Button variant="link" className="sidebar-close" onClick={onClose} aria-label="close sidebar">
                            <Icon name="x" className="align-middle" />
                        </Button>
                    </div>

                    <div className="sidebar-scroll">
                        <SidebarMenu sections={activeTab.sections} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
