import { describe, it, expect } from 'vitest';
import {
    canViewRoute,
    filterSidebarTabs,
    filterQuickLinks,
    filterProfileMenuItems,
    type CanViewFn,
} from '@/utils/navigation';
import { sidebarTabs, headerQuickLinks, profileMenuItems } from '@/data/navigationData';

/** Build a canView callback from a set of module names the role may view. */
const canViewOf = (modules: string[]): CanViewFn => (module: string) => modules.includes(module);

// Real permission sets from the seed DB (V16__seed_dashboard_data.sql roles).
const CHEF_MODULES = ['Products', 'Categories', 'Orders', 'Kitchen (KDS)', 'Addons'];
const WAITER_MODULES = [
    'POS',
    'Hold/Resume Sale',
    'Products',
    'Categories',
    'Customers',
    'Orders',
    'Tables',
    'Reservation',
    'Kitchen (KDS)',
    'Invoices',
    'Payments',
    'Coupons',
    'Addons',
];
const ALL_MODULES = [
    'Dashboard',
    'POS',
    'Hold/Resume Sale',
    'Refund / Return',
    'Products',
    'Categories',
    'Customers',
    'Orders',
    'Tables',
    'Reservation',
    'Kitchen (KDS)',
    'Invoices',
    'Payments',
    'Coupons',
    'Addons',
    'Reports',
    'Settings',
    'Manage Staffs',
    'Audit Logs',
];

describe('canViewRoute', () => {
    it('allows routes without a permission mapping (auth pages)', () => {
        expect(canViewRoute('/login', canViewOf([]))).toBe(true);
        expect(canViewRoute('/register', canViewOf([]))).toBe(true);
        expect(canViewRoute('/forgot-password', canViewOf([]))).toBe(true);
        expect(canViewRoute('/otp', canViewOf([]))).toBe(true);
    });

    it('allows routes the role can view', () => {
        expect(canViewRoute('/orders', canViewOf(CHEF_MODULES))).toBe(true);
        expect(canViewRoute('/items', canViewOf(CHEF_MODULES))).toBe(true);
        expect(canViewRoute('/dashboard', canViewOf(ALL_MODULES))).toBe(true);
    });

    it('rejects routes the role cannot view', () => {
        const chef = canViewOf(CHEF_MODULES);
        expect(canViewRoute('/dashboard', chef)).toBe(false);
        expect(canViewRoute('/pos', chef)).toBe(false);
        expect(canViewRoute('/reports', chef)).toBe(false);
        expect(canViewRoute('/users', chef)).toBe(false);
        expect(canViewRoute('/tables', chef)).toBe(false);
    });
});

describe('filterSidebarTabs', () => {
    it('keeps a Chef only on tabs that still have at least one viewable item', () => {
        const tabs = filterSidebarTabs(sidebarTabs, canViewOf(CHEF_MODULES));
        const ids = tabs.map((t) => t.id);

        // Dashboard tab survives because Orders + Kitchen items remain.
        expect(ids).toContain('dashboard');
        // Menu management survives (Categories/Items/Addons).
        expect(ids).toContain('menu-management');
        // Pages tab survives (auth links have no permission mapping).
        expect(ids).toContain('pages');

        // Operations, Administration and Settings have zero viewable items.
        expect(ids).not.toContain('operations');
        expect(ids).not.toContain('administration');
        expect(ids).not.toContain('settings');
    });

    it('drops hidden items from a kept tab and keeps hidden sections empty-filtered', () => {
        const tabs = filterSidebarTabs(sidebarTabs, canViewOf(CHEF_MODULES));
        const dashboard = tabs.find((t) => t.id === 'dashboard')!;
        const items = dashboard.sections.flatMap((s) => s.items).map((i) => i.href);

        expect(items).toContain('/orders');
        expect(items).toContain('/kitchen');
        expect(items).not.toContain('/dashboard');
        expect(items).not.toContain('/pos');
        expect(items).not.toContain('/reservation');
    });

    it('keeps every tab for an admin-like role with all modules', () => {
        const tabs = filterSidebarTabs(sidebarTabs, canViewOf(ALL_MODULES));
        expect(tabs.length).toBe(sidebarTabs.length);
    });

    it('keeps only the Pages tab when the role cannot view any feature', () => {
        const tabs = filterSidebarTabs(sidebarTabs, canViewOf([]));
        // Auth pages have no permission mapping, so the Pages tab always survives.
        expect(tabs.map((t) => t.id)).toEqual(['pages']);
    });
});

describe('filterQuickLinks', () => {
    it('shows only Orders + Kitchen for a Chef', () => {
        const links = filterQuickLinks(headerQuickLinks, canViewOf(CHEF_MODULES));
        expect(links.map((l) => l.href)).toEqual(['/orders', '/kitchen']);
    });

    it('shows all quick links for a role with all permissions', () => {
        const links = filterQuickLinks(headerQuickLinks, canViewOf(ALL_MODULES));
        expect(links.length).toBe(headerQuickLinks.length);
    });

    it('hides only the admin-only quick links for a Waiter', () => {
        // Waiters cannot see Reports/Settings; all 5 quick links map to features.
        const links = filterQuickLinks(headerQuickLinks, canViewOf(WAITER_MODULES));
        expect(links.length).toBe(headerQuickLinks.length);
    });
});

describe('filterSidebarTabs — Waiter', () => {
    it('keeps feature tabs but hides administration and settings', () => {
        const tabs = filterSidebarTabs(sidebarTabs, canViewOf(WAITER_MODULES));
        const ids = tabs.map((t) => t.id);

        expect(ids).toContain('dashboard'); // POS/Orders/Kitchen/Reservation
        expect(ids).toContain('menu-management');
        expect(ids).toContain('operations'); // Tables/Customers/Invoices/Payments
        expect(ids).toContain('pages');
        expect(ids).not.toContain('administration');
        expect(ids).not.toContain('settings');
    });
});

describe('filterProfileMenuItems', () => {
    it('hides all admin-only profile items for a Chef', () => {
        const items = filterProfileMenuItems(profileMenuItems, canViewOf(CHEF_MODULES));
        expect(items).toEqual([]);
    });

    it('keeps all profile items for an admin-like role', () => {
        const items = filterProfileMenuItems(profileMenuItems, canViewOf(ALL_MODULES));
        expect(items.length).toBe(profileMenuItems.length);
    });
});
