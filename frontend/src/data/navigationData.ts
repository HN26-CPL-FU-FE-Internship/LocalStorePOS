import configs from '@/configs';
import type { QuickLink, SidebarTab, StoreOption, UserProfile, ProfileMenuItem } from '../types';

// NOTE: every static href from the original HTML (pos.html, orders.html, ...)
// has been replaced with the placeholder "lorem ipsum" as requested.
// Swap these for real routes (e.g. React Router paths) before shipping.
const { routes } = configs;

export const headerQuickLinks: QuickLink[] = [
    { id: 'pos', label: 'POS', icon: 'hand-platter', href: routes.pos },
    { id: 'orders', label: 'Orders', icon: 'list-todo', href: routes.orders },
    { id: 'kitchen', label: 'Kitchen', icon: 'drumstick', href: routes.kitchen },
    {
        id: 'reservation',
        label: 'Reservation',
        icon: 'file-clock',
        href: routes.reservation,
    },
    {
        id: 'table',
        label: 'Table',
        icon: 'concierge-bell',
        href: routes.tables,
    },
];

export const storeOptions: StoreOption[] = [
    { id: 'store-1', name: 'Streak House', imageUrl: '/restaurant-pos/src/assets/img/store/store-01.jpg' },
    { id: 'store-2', name: 'Hotchilli Hub', imageUrl: '/restaurant-pos/src/assets/img/store/store-02.jpg' },
    { id: 'store-3', name: 'The Flavor Lab', imageUrl: '/restaurant-pos/src/assets/img/store/store-03.jpg' },
];

export const currentUser: UserProfile = {
    name: 'Adrian James',
    role: 'Administrator',
    avatarUrl: '/restaurant-pos/src/assets/img/profiles/avatar-27.jpg',
    plan: 'Pro',
};

export const profileMenuItems: ProfileMenuItem[] = [
    { id: 'store-settings', label: 'Store Settings', icon: 'warehouse', href: routes['store-settings'] },
    { id: 'role-permission', label: 'Roles & Permissions', icon: 'shield-ellipsis', href: routes['role-permissions'] },
    { id: 'audit-report', label: 'Audit Logs', icon: 'clock-arrow-down', href: routes['audit-reports'] },
    { id: 'users', label: 'Manage Staffs', icon: 'user-pen', href: routes.users },
];

// Two-column sidebar: left icon rail (tabs) + right contextual menu panel.
export const sidebarTabs: SidebarTab[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'layout-dashboard',
        endpoints: [routes.dashboard, routes.pos, routes.kitchen, routes.orders, routes.reservation],
        sections: [
            {
                id: 'main',
                title: 'MAIN',
                items: [
                    {
                        id: 'dashboard',
                        label: 'Dashboard',
                        icon: 'layout-dashboard',
                        href: routes.dashboard,
                        active: true,
                    },
                    { id: 'pos', label: 'POS', icon: 'combine', href: routes.pos },
                    { id: 'orders', label: 'Orders', icon: 'list-todo', href: routes.orders },
                    { id: 'kitchen', label: 'Kitchen (KDS)', icon: 'drumstick', href: routes.kitchen },
                    { id: 'reservation', label: 'Reservation', icon: 'file-clock', href: routes.reservation },
                ],
            },
        ],
    },
    {
        id: 'menu-management',
        title: 'Management',
        icon: 'layers',
        endpoints: [routes.categories, routes.items, routes.addons, routes.coupons],
        sections: [
            {
                id: 'menu-management',
                title: 'MENU MANAGEMENT',
                items: [
                    { id: 'categories', label: 'Categories', icon: 'layers', href: routes.categories },
                    { id: 'items', label: 'Items', icon: 'layout-list', href: routes.items },
                    { id: 'addons', label: 'Addons', icon: 'text-select', href: routes.addons },
                    { id: 'coupons', label: 'Coupons', icon: 'badge-percent', href: routes.coupons },
                ],
            },
        ],
    },
    {
        id: 'operations',
        title: 'Operations',
        icon: 'merge',
        endpoints: [routes.tables, routes.customers, routes.invoices, routes.payments],
        sections: [
            {
                id: 'operations',
                title: 'OPERATIONS',
                items: [
                    { id: 'tables', label: 'Tables', icon: 'concierge-bell', href: routes.tables },
                    { id: 'customers', label: 'Customers', icon: 'user-round', href: routes.customers },
                    { id: 'invoices', label: 'Invoices', icon: 'file-spreadsheet', href: routes.invoices },
                    { id: 'payments', label: 'Payments', icon: 'badge-dollar-sign', href: routes.payments },
                ],
            },
        ],
    },
    {
        id: 'administration',
        title: 'Administration',
        icon: 'user-cog',
        endpoints: [
            routes.users,
            routes['role-permissions'],
            routes['earning-reports'],
            routes['sale-reports'],
            routes['order-reports'],
            routes['customer-reports'],
            routes['audit-reports'],
        ],
        sections: [
            {
                id: 'administration',
                title: 'ADMINISTRATION',
                items: [
                    { id: 'users', label: 'Users', icon: 'users', href: routes.users },
                    { id: 'role-permission', label: 'Permissions', icon: 'shield', href: routes['role-permissions'] },
                    { id: 'reports', label: 'Reports', icon: 'file-spreadsheet', href: routes['earning-reports'] },
                ],
            },
        ],
    },
    {
        id: 'pages',
        title: 'Pages',
        icon: 'library-big',
        endpoints: [],
        sections: [
            {
                id: 'pages',
                title: 'Pages',
                items: [
                    { id: 'login', label: 'Sign In', icon: 'lock-keyhole', href: routes.login },
                    { id: 'register', label: 'Sign Up', icon: 'user-round-plus', href: routes.register },
                    {
                        id: 'forgot-password',
                        label: 'Forgot Password',
                        icon: 'lock-keyhole-open',
                        href: routes.forgotPassword,
                    },
                    { id: 'email-verification', label: 'Email Verification', icon: 'mail', href: routes.emailVerify },
                    { id: 'otp', label: 'OTP', icon: 'blocks', href: routes.otp },
                    { id: 'reset-password', label: 'Reset Password', icon: 'lock-keyhole', href: routes.resetPassword },
                ],
            },
        ],
    },
    {
        id: 'settings',
        title: 'Settings',
        icon: 'cog',
        endpoints: [
            routes['store-settings'],
            routes['tax-settings'],
            routes['print-settings'],
            routes['payment-settings'],
            routes['delivery-settings'],
            routes['notifications-settings'],
            routes['integrations-settings'],
        ],
        sections: [
            {
                id: 'settings',
                title: 'SETTINGS',
                items: [
                    {
                        id: 'store-settings',
                        label: 'Store Settings',
                        icon: 'warehouse',
                        href: routes['store-settings'],
                    },
                    { id: 'tax-settings', label: 'Tax', icon: 'diamond-percent', href: routes['tax-settings'] },
                    { id: 'print-settings', label: 'Print', icon: 'printer', href: routes['print-settings'] },
                    {
                        id: 'payment-settings',
                        label: 'Payment Types',
                        icon: 'circle-dollar-sign',
                        href: routes['payment-settings'],
                    },
                    { id: 'delivery-settings', label: 'Delivery', icon: 'bike', href: routes['delivery-settings'] },
                    {
                        id: 'notifications-settings',
                        label: 'Notifications',
                        icon: 'bell',
                        href: routes['notifications-settings'],
                    },
                    {
                        id: 'integrations-settings',
                        label: 'Integrations / API',
                        icon: 'pin',
                        href: routes['integrations-settings'],
                    },
                ],
            },
        ],
    },
];

export const logoutHref = routes.pos;
