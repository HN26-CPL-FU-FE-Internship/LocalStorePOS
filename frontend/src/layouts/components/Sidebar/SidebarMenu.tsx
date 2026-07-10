import Nav from 'react-bootstrap/Nav';
import Icon from '@/components/common/Icon';
import type { SidebarMenuSection } from '@/types';
import { Link, useLocation } from 'react-router-dom';

export interface SidebarMenuProps {
    sections: SidebarMenuSection[];
}

/** Data-driven replacement for the repeated <ul><li class="menu-title">...</ul> blocks. */
const SidebarMenu = ({ sections }: SidebarMenuProps) => {
    const location = useLocation();

    return (
        <>
            {sections.map((section) => (
                <Nav className="flex-column" key={section.id} as="ul">
                    <li className="menu-title">
                        <span>{section.title}</span>
                    </li>
                    {section.items.map((item) => (
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
            ))}
        </>
    );
};

export default SidebarMenu;
