// Shared domain types used across the dashboard module.
// Extend/split these as the app grows beyond the dashboard page.

import type { ReactNode } from 'react';

export type TrendDirection = 'up' | 'down';

export type BootstrapVariant =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark'
    | 'purple'
    | 'orange'
    | 'indigo';

export interface QuickLink {
    id: string;
    label: string;
    icon: string; // lucide icon name, without the "icon-" prefix
    href: string;
}

export interface StatCardData {
    id: string;
    value: string;
    change: {
        value: string;
        trend: TrendDirection;
    };
    label: string;
    icon: string;
    color: BootstrapVariant;
}

export interface CustomerSearchResult {
    id: string;
    name: string;
    gender: string;
    code: string;
    avatarUrl?: string;
}

export interface OrderSearchResult {
    id: string;
    orderNo: string;
    type: 'Dine In' | 'Take Away' | 'Delivery';
    tableNo?: string;
    tokenNo: string;
}

export interface KitchenSearchResult {
    id: string;
    name: string;
    ref: string;
    tokenNo: string;
}

export interface NotificationItem {
    id: string;
    icon: string;
    variant: BootstrapVariant;
    message: ReactNode;
    time: string;
    actionable?: boolean;
    actions?: { label: string; variant: BootstrapVariant | 'white' }[];
}

export interface NotificationGroup {
    id: string;
    heading: string;
    items: NotificationItem[];
}

export interface SidebarMenuItem {
    id: string;
    label: string;
    icon: string;
    href: string;
    active?: boolean;
}

export interface SidebarMenuSection {
    id: string;
    title: string;
    items: SidebarMenuItem[];
}

export interface SidebarTab {
    id: string;
    title: string;
    icon: string;
    endpoints: string[];
    sections: SidebarMenuSection[];
}

export interface StoreOption {
    id: string;
    name: string;
    imageUrl: string;
}

export interface UserProfile {
    name: string;
    role: string;
    avatarUrl: string;
    plan?: string;
}

export interface ProfileMenuItem {
    id: string;
    label: string;
    icon: string;
    href: string;
}

export interface TopSellingItem {
    id: string;
    rank: number;
    name: string;
    imageUrl?: string;
    orders: number;
    progressPercent: number;
    color: BootstrapVariant;
}

export interface CategoryStat {
    id: string;
    label: string;
    icon: string;
    color: BootstrapVariant;
    orders: number;
}

export interface ActiveOrder {
    id: string;
    customerName: string;
    avatarUrl?: string;
    type: 'Dine In' | 'Take Away' | 'Reservation';
    tableNo?: string;
    status: string;
    statusVariant: BootstrapVariant;
}

export interface SalesSummaryItem {
    id: string;
    label: string;
    value: string;
    change: string;
    icon: string;
    color: BootstrapVariant;
}

export interface TrendingMenu {
    id: string;
    name: string;
    imageUrl: string;
    orders: number;
    dietType: 'Veg' | 'Non Veg';
}

export interface AvatarStackItem {
    id: string;
    imageUrl: string;
    alt: string;
}

export interface ReservationItem {
    id: string;
    day: string;
    year: string;
    customerName: string;
    time: string;
    tables: number;
    guests: number;
    status: string;
    statusVariant: BootstrapVariant;
}

export interface TableAvailability {
    id: string;
    name: string;
    guests: number;
    imageUrl: string;
}

export interface ActivityLogItem {
    id: string;
    icon: string;
    color: BootstrapVariant;
    message: ReactNode;
    time: string;
}

export interface ActivityLogGroup {
    id: string;
    heading: string;
    items: ActivityLogItem[];
}

export type { PageResponse, Pageable, Sort } from './pageAble';

export type { ThemeType } from './theme';
export type { OrderQuery, OrderStat, OrderSummary, ModalActionProps, OrderUpdateStatus } from './order';
export type { Time } from './time';
