import { type PropsWithChildren } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { ROUTE_PERMISSION_MAP } from '@/types/permission';

export interface AuthGuardProps extends PropsWithChildren {
    /** If true, the route does NOT require authentication (public) */
    publicRoute?: boolean;
}

/**
 * Route guard that:
 * - Redirects unauthenticated users to login (401 equivalent)
 * - Checks view permission for protected routes (403 equivalent)
 * - Shows 403 page for unauthorized route access
 * - Lets public routes pass through
 */
const AuthGuard = ({ children, publicRoute = false }: AuthGuardProps) => {
    const { isAuthenticated, isLoading, canView } = useAuth();
    const location = useLocation();

    // Show nothing while checking auth status
    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // Public routes: always accessible
    if (publicRoute) {
        return <>{children}</>;
    }

    // Not authenticated → redirect to login (401)
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check view permission for the current route
    const requiredModule = ROUTE_PERMISSION_MAP[location.pathname];
    if (requiredModule && !canView(requiredModule)) {
        // 403 - Forbidden: user doesn't have view permission for this module
        return <ForbiddenPage />;
    }

    return <>{children}</>;
};

/** Simple 403 Forbidden page */
const ForbiddenPage = () => {
    const navigate = useNavigate();
    return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center px-3">
            <h1 className="display-1 fw-bold text-danger">403</h1>
            <h4 className="mb-3">Access Denied</h4>
            <p className="text-muted mb-4">
                You do not have permission to access this page.
                Please contact your administrator if you believe this is a mistake.
            </p>
            <button
                className="btn btn-primary"
                onClick={() => navigate(-1)}
            >
                Go back to previous page
            </button>
        </div>
    );
};

export default AuthGuard;
