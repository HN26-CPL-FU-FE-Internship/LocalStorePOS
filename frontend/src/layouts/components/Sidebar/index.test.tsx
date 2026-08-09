import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './index';

// Real Chef permission set from the seed DB (V16__seed_dashboard_data.sql).
// hoisted so the vi.mock factory (also hoisted) can reference it safely.
const { CHEF_MODULES, mockCanView } = vi.hoisted(() => ({
    CHEF_MODULES: ['Products', 'Categories', 'Orders', 'Kitchen (KDS)', 'Addons'],
    mockCanView: vi.fn((module: string) => CHEF_MODULES.includes(module)),
}));

vi.mock('@/hooks/useAuth', () => ({
    default: () => ({
        user: { role: 'Chef' },
        isAuthenticated: true,
        isLoading: false,
        logout: vi.fn(),
        hasPermission: vi.fn(),
        canView: mockCanView,
        isAdmin: false,
    }),
}));

vi.mock('@/hooks/useNotifications', () => ({
    useNotifications: () => ({
        groups: [],
        unreadGroups: [],
        unreadCount: 0,
        markAsRead: vi.fn(),
        markAsUnread: vi.fn(),
        markAllAsRead: vi.fn(),
        acceptAction: vi.fn(),
        declineAction: vi.fn(),
        isLoading: false,
        isError: false,
    }),
}));

vi.mock('./NotificationsDropdown', () => ({
    default: () => <div data-testid="notifications-dropdown" />,
}));

vi.mock('./ProfileDropdown', () => ({
    default: () => <div data-testid="profile-dropdown" />,
}));

vi.mock('./StoreSwitcherDropdown', () => ({
    default: () => <div data-testid="store-switcher" />,
}));

const renderSidebar = (path = '/dashboard') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Sidebar onClose={vi.fn()} />
        </MemoryRouter>,
    );

describe('Sidebar — icon rail (Chef role)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset to the Chef permission set by default.
        mockCanView.mockImplementation((module: string) => CHEF_MODULES.includes(module));
    });

    it('shows only tabs a Chef has at least one item in', () => {
        renderSidebar();

        // Dashboard tab survives (Orders + Kitchen items remain viewable).
        expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
        // Menu Management survives (Categories/Items/Addons).
        expect(screen.getByTitle('Management')).toBeInTheDocument();
        // Pages tab survives (auth links have no permission mapping).
        expect(screen.getByTitle('Pages')).toBeInTheDocument();

        // Hidden: no viewable items at all.
        expect(screen.queryByTitle('Operations')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Administration')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Settings')).not.toBeInTheDocument();
    });

    it('renders the default active tab menu with only permitted items', () => {
        renderSidebar('/dashboard');

        // SidebarMenu for the dashboard tab: Chef can see Orders + Kitchen only.
        expect(screen.getByText('Orders')).toBeInTheDocument();
        expect(screen.getByText('Kitchen (KDS)')).toBeInTheDocument();
        expect(screen.queryByText('POS')).not.toBeInTheDocument();
        expect(screen.queryByText('Reservation')).not.toBeInTheDocument();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('switches the menu panel when another visible tab is clicked', () => {
        renderSidebar('/dashboard');

        fireEvent.click(screen.getByTitle('Management'));

        expect(screen.getByText('Categories')).toBeInTheDocument();
        expect(screen.getByText('Items')).toBeInTheDocument();
        expect(screen.getByText('Addons')).toBeInTheDocument();
        // Coupons not in Chef's permission set.
        expect(screen.queryByText('Coupons')).not.toBeInTheDocument();
    });

    it('falls back to the first visible tab when the current route tab is hidden', () => {
        // '/users' belongs to the Administration tab — hidden for Chef.
        renderSidebar('/users');

        // Fallback lands on the dashboard tab (first visible), not Administration.
        expect(screen.queryByTitle('Administration')).not.toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
        expect(screen.getByText('Kitchen (KDS)')).toBeInTheDocument();
    });
});

describe('Sidebar — icon rail (other roles)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows every tab for an admin-like role with all modules', () => {
        mockCanView.mockImplementation(() => true);
        renderSidebar('/dashboard');

        expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
        expect(screen.getByTitle('Management')).toBeInTheDocument();
        expect(screen.getByTitle('Operations')).toBeInTheDocument();
        expect(screen.getByTitle('Administration')).toBeInTheDocument();
        expect(screen.getByTitle('Pages')).toBeInTheDocument();
        expect(screen.getByTitle('Settings')).toBeInTheDocument();
    });

    it('renders an empty icon rail when the role cannot view any feature', () => {
        mockCanView.mockImplementation(() => false);
        renderSidebar('/dashboard');

        // No tab icons render; the menu falls back safely to nothing viewable.
        expect(screen.queryByTitle('Dashboard')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Operations')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Settings')).not.toBeInTheDocument();
        expect(screen.queryByText('Orders')).not.toBeInTheDocument();
    });
});
