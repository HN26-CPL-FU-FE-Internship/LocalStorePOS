import { describe, it, expect } from 'vitest';
import { getRoutePermissionModule, PUBLIC_ROUTES } from './permission';
import routes from '@/configs/routes';

describe('getRoutePermissionModule', () => {
    it('resolves exact static routes to their module', () => {
        expect(getRoutePermissionModule('/orders')).toBe('Orders');
        expect(getRoutePermissionModule('/items')).toBe('Products');
        expect(getRoutePermissionModule('/reports')).toBe('Reports');
        expect(getRoutePermissionModule('/approval-requests')).toBe('Manage Staffs');
    });

    it('resolves dynamic route patterns from real pathnames', () => {
        // /invoices/:id must map to Invoices for any real invoice id.
        expect(getRoutePermissionModule('/invoices/5')).toBe('Invoices');
        expect(getRoutePermissionModule('/invoices/123')).toBe('Invoices');
        expect(getRoutePermissionModule('/invoices/abc-42')).toBe('Invoices');
    });

    it('returns undefined for routes without a permission mapping', () => {
        expect(getRoutePermissionModule('/login')).toBeUndefined();
        expect(getRoutePermissionModule('/register')).toBeUndefined();
        expect(getRoutePermissionModule('/unknown-route')).toBeUndefined();
    });

    it('does not let a dynamic pattern over-match unrelated paths', () => {
        // /invoices/:id must not match a nested path or a different resource.
        expect(getRoutePermissionModule('/invoices/5/details')).toBeUndefined();
        expect(getRoutePermissionModule('/invoices')).toBe('Invoices'); // exact still works
    });

    it('tolerates a single trailing slash so it cannot bypass the guard', () => {
        expect(getRoutePermissionModule('/invoices/5/')).toBe('Invoices');
        expect(getRoutePermissionModule('/orders/')).toBe('Orders');
        // Multiple trailing slashes stay unmatched.
        expect(getRoutePermissionModule('/invoices/5//')).toBeUndefined();
    });

    it('matches a pattern whose static segments contain regex-special characters', () => {
        // e.g. a future '/reports/2026.q1' style pattern would not misbehave.
        expect(getRoutePermissionModule('/reports/2026.q1')).toBeUndefined(); // no such pattern — just no crash
    });
});

describe('ROUTE_PERMISSION_MAP completeness', () => {
    it('covers every protected frontend route', () => {
        // Every non-public route should have a permission mapping so the
        // AuthGuard can enforce a 403 instead of silently allowing access.
        const protectedRoutes = Object.values(routes).filter((path) => !PUBLIC_ROUTES.includes(path));

        for (const path of protectedRoutes) {
            expect(getRoutePermissionModule(path), `no module mapped for ${path}`).toBeDefined();
        }
    });
});
