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
    '/payments': 'Payments',
    '/users': 'Manage Staffs',
    '/role-permissions': 'Manage Staffs',
    '/reports/earning-report': 'Reports',
    '/reports/order-report': 'Reports',
    '/reports/sale-report': 'Reports',
    '/reports/customer-report': 'Reports',
    '/reports/audit-report': 'Reports',
    '/store-settings': 'Settings',
    '/tax-settings': 'Settings',
    '/print-settings': 'Settings',
    '/payment-settings': 'Settings',
    '/delivery-settings': 'Settings',
    '/notifications-settings': 'Settings',
    '/integrations-settings': 'Settings',
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
