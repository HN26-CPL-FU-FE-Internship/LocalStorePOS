import Nav from 'react-bootstrap/Nav';
import Icon from '@/components/common/Icon';
import type { SidebarTab } from '@/types';

export interface IconRailProps {
    tabs: SidebarTab[];
    activeTabId: string;
    onSelectTab: (tab: SidebarTab) => void;
}

/**
 * Vertical icon-only tab list on the far left of the two-column sidebar
 * (Dashboard / Management / Operations / Administration / Pages / Settings).
 */
const IconRail = ({ tabs, activeTabId, onSelectTab }: IconRailProps) => {
    return (
        <Nav
            variant="pills"
            className="flex-column align-items-center sidebar-nav simplebar-content-wrapper"
            id="sidebar-tabs"
            data-simplebar
            activeKey={activeTabId}
        >
            {tabs.map((tab) => {
                return (
                    <Nav.Item key={tab.id}>
                        <Nav.Link eventKey={tab.id} title={tab.title} onClick={() => onSelectTab(tab)}>
                            <Icon name={tab.icon} />
                        </Nav.Link>
                    </Nav.Item>
                );
            })}
        </Nav>
    );
};

export default IconRail;
