import type { ProfileMenuItem, QuickLink, SidebarTab } from '@/types';
import { getRoutePermissionModule } from '@/types/permission';

export type CanViewFn = (module: string) => boolean;

/**
 * Whether the current user may view the route. Routes without a permission
 * mapping (e.g. auth pages) are always allowed; routes with a mapping require
 * the "view" permission on that module. Dynamic patterns (e.g. /invoices/:id)
 * are resolved via getRoutePermissionModule.
 */
export const canViewRoute = (href: string, canView: CanViewFn): boolean => {
    const module = getRoutePermissionModule(href);
    return !module || canView(module);
};

/**
 * Filter sidebar tabs by permission: a tab is kept only when at least one of
 * its menu items is viewable, and empty sections are dropped too. This hides
 * the icon rail entry for tabs a role has no feature in.
 */
export const filterSidebarTabs = (tabs: SidebarTab[], canView: CanViewFn): SidebarTab[] =>
    tabs
        .map((tab) => ({
            ...tab,
            sections: tab.sections
                .map((section) => ({
                    ...section,
                    items: section.items.filter((item) => canViewRoute(item.href, canView)),
                }))
                .filter((section) => section.items.length > 0),
        }))
        .filter((tab) => tab.sections.length > 0);

/** Filter header quick links by permission. */
export const filterQuickLinks = (links: QuickLink[], canView: CanViewFn): QuickLink[] =>
    links.filter((link) => canViewRoute(link.href, canView));

/** Filter profile dropdown menu items by permission. */
export const filterProfileMenuItems = (items: ProfileMenuItem[], canView: CanViewFn): ProfileMenuItem[] =>
    items.filter((item) => canViewRoute(item.href, canView));
