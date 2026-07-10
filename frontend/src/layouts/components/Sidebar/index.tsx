import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Icon from '@/components/common/Icon';
import IconRail from './IconRail';
import SidebarMenu from './SidebarMenu';
import NotificationsDropdown from './NotificationsDropdown';
import ProfileDropdown from './ProfileDropdown';
import StoreSwitcherDropdown from './StoreSwitcherDropdown';
import { sidebarTabs, storeOptions, currentUser, profileMenuItems, logoutHref } from '@/data/navigationData';
import { notificationGroups } from '@/data/dashboardData';
import { Link, useLocation } from 'react-router-dom';
import configs from '@/configs';

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

    const { pathname } = useLocation();

    const [activeTab, setActiveTab] = useState(
        () => sidebarTabs.find((tab) => tab.endpoints.includes(pathname)) ?? sidebarTabs[0],
    );

    return (
        <div className="two-col-sidebar" id="two-col-sidebar">
            <div className="sidebar sidebar-twocol">
                <div className="twocol-mini">
                    <Link to={configs.routes.dashboard} className="logo-small">
                        <img src="/restaurant-pos/src/assets/img/logo-small.svg" alt="Logo" />
                    </Link>

                    <div className="sidebar-left">
                        <IconRail tabs={sidebarTabs} activeTabId={activeTab.id} onSelectTab={setActiveTab} />

                        <div className="sidebar-profile ">
                            <NotificationsDropdown groups={notificationGroups} unreadCount={4} />
                            <ProfileDropdown user={currentUser} menuItems={profileMenuItems} logoutHref={logoutHref} />
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
