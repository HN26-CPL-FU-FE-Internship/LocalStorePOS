import type { ReactNode } from 'react';
import useAuth from '@/hooks/useAuth';

export interface RequirePermissionProps {
    /** The permission module name (e.g. "Manage Staffs", "Categories") */
    module: string;
    /** The action to check (default: "view") */
    action?: 'view' | 'add' | 'edit' | 'delete' | 'export' | 'approvedVoid';
    /** Content to render when permission is granted */
    children: ReactNode;
    /** Optional fallback content when permission is denied */
    fallback?: ReactNode;
}

/**
 * Conditionally renders children based on user's permission.
 * Useful for hiding buttons, controls, or sections.
 *
 * @example
 * <RequirePermission module="Categories" action="add">
 *   <button>Add Category</button>
 * </RequirePermission>
 */
const RequirePermission = ({ module, action = 'view', children, fallback = null }: RequirePermissionProps) => {
    const { hasPermission } = useAuth();

    if (hasPermission(module, action)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

export default RequirePermission;
