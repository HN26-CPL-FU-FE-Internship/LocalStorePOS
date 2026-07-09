import type { QuickLink, SidebarTab, StoreOption, UserProfile, ProfileMenuItem } from '../types';

// NOTE: every static href from the original HTML (pos.html, orders.html, ...)
// has been replaced with the placeholder "lorem ipsum" as requested.
// Swap these for real routes (e.g. React Router paths) before shipping.
const PLACEHOLDER_HREF = '#';

export const headerQuickLinks: QuickLink[] = [
    { id: 'pos', label: 'POS', icon: 'hand-platter', href: PLACEHOLDER_HREF },
    { id: 'orders', label: 'Orders', icon: 'list-todo', href: PLACEHOLDER_HREF },
    { id: 'kitchen', label: 'Kitchen', icon: 'drumstick', href: PLACEHOLDER_HREF },
    {
        id: 'reservation',
        label: 'Reservation',
        icon: 'file-clock',
        href: PLACEHOLDER_HREF,
    },
    {
        id: 'table',
        label: 'Table',
        icon: 'concierge-bell',
        href: PLACEHOLDER_HREF,
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
    { id: 'store-settings', label: 'Store Settings', icon: 'warehouse', href: PLACEHOLDER_HREF },
    { id: 'role-permission', label: 'Roles & Permissions', icon: 'shield-ellipsis', href: PLACEHOLDER_HREF },
    { id: 'audit-report', label: 'Audit Logs', icon: 'clock-arrow-down', href: PLACEHOLDER_HREF },
    { id: 'users', label: 'Manage Staffs', icon: 'user-pen', href: PLACEHOLDER_HREF },
];

// Two-column sidebar: left icon rail (tabs) + right contextual menu panel.
export const sidebarTabs: SidebarTab[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'layout-dashboard',
        sections: [
            {
                id: 'main',
                title: 'MAIN',
                items: [
                    {
                        id: 'dashboard',
                        label: 'Dashboard',
                        icon: 'layout-dashboard',
                        href: PLACEHOLDER_HREF,
                        active: true,
                    },
                    { id: 'pos', label: 'POS', icon: 'combine', href: PLACEHOLDER_HREF },
                    { id: 'orders', label: 'Orders', icon: 'list-todo', href: PLACEHOLDER_HREF },
                    { id: 'kitchen', label: 'Kitchen (KDS)', icon: 'drumstick', href: PLACEHOLDER_HREF },
                    { id: 'reservation', label: 'Reservation', icon: 'file-clock', href: PLACEHOLDER_HREF },
                ],
            },
        ],
    },
    {
        id: 'menu-management',
        title: 'Management',
        icon: 'layers',
        sections: [
            {
                id: 'menu-management',
                title: 'MENU MANAGEMENT',
                items: [
                    { id: 'categories', label: 'Categories', icon: 'layers', href: PLACEHOLDER_HREF },
                    { id: 'items', label: 'Items', icon: 'layout-list', href: PLACEHOLDER_HREF },
                    { id: 'addons', label: 'Addons', icon: 'text-select', href: PLACEHOLDER_HREF },
                    { id: 'coupons', label: 'Coupons', icon: 'badge-percent', href: PLACEHOLDER_HREF },
                ],
            },
        ],
    },
    {
        id: 'operations',
        title: 'Operations',
        icon: 'merge',
        sections: [
            {
                id: 'operations',
                title: 'OPERATIONS',
                items: [
                    { id: 'tables', label: 'Tables', icon: 'concierge-bell', href: PLACEHOLDER_HREF },
                    { id: 'customers', label: 'Customers', icon: 'user-round', href: PLACEHOLDER_HREF },
                    { id: 'invoices', label: 'Invoices', icon: 'file-spreadsheet', href: PLACEHOLDER_HREF },
                    { id: 'payments', label: 'Payments', icon: 'badge-dollar-sign', href: PLACEHOLDER_HREF },
                ],
            },
        ],
    },
    {
        id: 'administration',
        title: 'Administration',
        icon: 'user-cog',
        sections: [
            {
                id: 'administration',
                title: 'ADMINISTRATION',
                items: [
                    { id: 'users', label: 'Users', icon: 'users', href: PLACEHOLDER_HREF },
                    { id: 'role-permission', label: 'Permissions', icon: 'shield', href: PLACEHOLDER_HREF },
                    { id: 'reports', label: 'Reports', icon: 'file-spreadsheet', href: PLACEHOLDER_HREF },
                ],
            },
        ],
    },
    {
        id: 'pages',
        title: 'Pages',
        icon: 'library-big',
        sections: [
            {
                id: 'pages',
                title: 'Pages',
                items: [
                    { id: 'login', label: 'Sign In', icon: 'lock-keyhole', href: PLACEHOLDER_HREF },
                    { id: 'register', label: 'Sign Up', icon: 'user-round-plus', href: PLACEHOLDER_HREF },
                    {
                        id: 'forgot-password',
                        label: 'Forgot Password',
                        icon: 'lock-keyhole-open',
                        href: PLACEHOLDER_HREF,
                    },
                    { id: 'email-verification', label: 'Email Verification', icon: 'mail', href: PLACEHOLDER_HREF },
                    { id: 'otp', label: 'OTP', icon: 'blocks', href: PLACEHOLDER_HREF },
                    { id: 'reset-password', label: 'Reset Password', icon: 'lock-keyhole', href: PLACEHOLDER_HREF },
                ],
            },
        ],
    },
    {
        id: 'settings',
        title: 'Settings',
        icon: 'cog',
        sections: [
            {
                id: 'settings',
                title: 'SETTINGS',
                items: [
                    { id: 'store-settings', label: 'Store Settings', icon: 'warehouse', href: PLACEHOLDER_HREF },
                    { id: 'tax-settings', label: 'Tax', icon: 'diamond-percent', href: PLACEHOLDER_HREF },
                    { id: 'print-settings', label: 'Print', icon: 'printer', href: PLACEHOLDER_HREF },
                    {
                        id: 'payment-settings',
                        label: 'Payment Types',
                        icon: 'circle-dollar-sign',
                        href: PLACEHOLDER_HREF,
                    },
                    { id: 'delivery-settings', label: 'Delivery', icon: 'bike', href: PLACEHOLDER_HREF },
                    { id: 'notifications-settings', label: 'Notifications', icon: 'bell', href: PLACEHOLDER_HREF },
                    { id: 'integrations-settings', label: 'Integrations / API', icon: 'pin', href: PLACEHOLDER_HREF },
                ],
            },
        ],
    },
];

export const logoutHref = PLACEHOLDER_HREF;
