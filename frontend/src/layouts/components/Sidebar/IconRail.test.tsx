import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IconRail from './IconRail';
import type { SidebarTab } from '@/types';

const makeTabs = (): SidebarTab[] => [
    {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'layout-dashboard',
        endpoints: ['/dashboard'],
        sections: [{ id: 'main', title: 'MAIN', items: [] }],
    },
    {
        id: 'menu-management',
        title: 'Management',
        icon: 'layers',
        endpoints: ['/items'],
        sections: [{ id: 'menu-management', title: 'MENU MANAGEMENT', items: [] }],
    },
    {
        id: 'operations',
        title: 'Operations',
        icon: 'merge',
        endpoints: ['/tables'],
        sections: [{ id: 'operations', title: 'OPERATIONS', items: [] }],
    },
];

describe('IconRail', () => {
    it('renders one nav item per tab with the tab title as tooltip', () => {
        const { container } = render(<IconRail tabs={makeTabs()} activeTabId="dashboard" onSelectTab={vi.fn()} />);

        expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
        expect(screen.getByTitle('Management')).toBeInTheDocument();
        expect(screen.getByTitle('Operations')).toBeInTheDocument();
        // react-bootstrap Nav.Link without `as` renders an <a> element.
        expect(container.querySelectorAll('#sidebar-tabs a')).toHaveLength(3);
    });

    it('marks the active tab', () => {
        const { container } = render(
            <IconRail tabs={makeTabs()} activeTabId="menu-management" onSelectTab={vi.fn()} />,
        );

        const activeLink = screen.getByTitle('Management').closest('a');
        expect(activeLink).toHaveClass('active');
        expect(screen.getByTitle('Dashboard').closest('a')).not.toHaveClass('active');
        expect(container.querySelector('#sidebar-tabs')).not.toBeNull();
    });

    it('calls onSelectTab with the clicked tab', () => {
        const onSelectTab = vi.fn();
        const tabs = makeTabs();
        render(<IconRail tabs={tabs} activeTabId="dashboard" onSelectTab={onSelectTab} />);

        fireEvent.click(screen.getByTitle('Operations'));
        expect(onSelectTab).toHaveBeenCalledTimes(1);
        expect(onSelectTab).toHaveBeenCalledWith(tabs[2]);
    });
});
