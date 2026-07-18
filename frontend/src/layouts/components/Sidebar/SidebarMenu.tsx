import Nav from 'react-bootstrap/Nav';
import Icon from '@/components/common/Icon';
import type { SidebarMenuSection } from '@/types';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { ROUTE_PERMISSION_MAP } from '@/types/permission';

export interface SidebarMenuProps {
    sections: SidebarMenuSection[];
}

/**
 * Data-driven sidebar menu that filters items based on user permissions.
 * Items without view permission will be hidden.
 */
const SidebarMenu = ({ sections }: SidebarMenuProps) => {
    const location = useLocation();
    const { canView } = useAuth();

    return (
        <>
            {sections.map((section) => {
                // Filter items based on view permission
                const visibleItems = section.items.filter((item) => {
                    const module = ROUTE_PERMISSION_MAP[item.href];
                    // If no permission mapping exists, allow the item
                    return !module || canView(module);
                });

                // Hide empty sections
                if (visibleItems.length === 0) return null;

                return (
                    <Nav className="flex-column" key={section.id} as="ul">
                        <li className="menu-title">
                            <span>{section.title}</span>
                        </li>
                        {visibleItems.map((item) => (
                            <Nav.Item as="li" key={item.id}>
                                <Nav.Link
                                    as={Link}
                                    to={item.href}
                                    active={item.href === location.pathname}
                                    className="d-flex align-items-center gap-2"
                                >
                                    <Icon name={item.icon} />
                                    <span>{item.label}</span>
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>
                );
            })}
        </>
    );
};

export default SidebarMenu;
