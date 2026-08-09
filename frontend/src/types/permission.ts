export interface PermissionModule {
    module: string;
    view: boolean;
    add: boolean;
    edit: boolean;
    delete_: boolean;
    export_: boolean;
    approvedVoid: boolean;
}

export interface UserInfo {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    avatarPath: string | null;
    status: string;
    permissions: PermissionModule[];
}

/** Maps each frontend route to its backend permission module name */
export const ROUTE_PERMISSION_MAP: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/pos': 'POS',
    '/orders': 'Orders',
    '/kitchen': 'Kitchen (KDS)',
    '/reservation': 'Reservation',
    '/categories': 'Categories',
    '/items': 'Products',
    '/addons': 'Addons',
    '/coupons': 'Coupons',
    '/tables': 'Tables',
    '/customers': 'Customers',
    '/invoices': 'Invoices',
    '/invoices/:id': 'Invoices',
    '/payments': 'Payments',
    '/users': 'Manage Staffs',
    '/role-permissions': 'Manage Staffs',
    '/reports': 'Reports',
    '/store-settings': 'Settings',
    '/tax-settings': 'Settings',
    '/print-settings': 'Settings',
    '/payment-settings': 'Settings',
    '/delivery-settings': 'Settings',
    '/notifications-settings': 'Settings',
    '/integrations-settings': 'Settings',
    '/approval-requests': 'Manage Staffs',
};

/** Escape regex special characters in a static path segment. */
const escapeRegexSegment = (segment: string) => segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Resolve the permission module required for a route pathname.
 *
 * Exact pathname lookup first; dynamic route patterns (e.g. `/invoices/:id`)
 * are matched by converting `:param` segments into wildcards so a real
 * pathname like `/invoices/5` resolves to its module instead of slipping
 * through the guard as an unauthenticated route. A single trailing slash is
 * tolerated so `/invoices/5/` cannot bypass the guard (React Router matches
 * both spellings).
 */
export const getRoutePermissionModule = (pathname: string): string | undefined => {
    // Normalize one trailing slash so static routes like `/orders/` still hit
    // their exact key; double slashes remain unmatched.
    const normalized = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;

    const exact = ROUTE_PERMISSION_MAP[normalized];
    if (exact) return exact;

    for (const [pattern, module] of Object.entries(ROUTE_PERMISSION_MAP)) {
        if (!pattern.includes(':')) continue;
        // Static segments are regex-escaped; `:param` segments become wildcards.
        const regex = new RegExp(
            `^${pattern.split('/').map((seg) => (seg.startsWith(':') ? '[^/]+' : escapeRegexSegment(seg))).join('/')}$`,
        );
        if (regex.test(normalized)) return module;
    }

    return undefined;
};

/** Public routes that don't require authentication */
export const PUBLIC_ROUTES = [
    '/login',
    '/register',
    '/otp',
    '/forgot-password',
    '/reset-password',
    '/email-verification',
    '/payment/:paymentCode',
];
