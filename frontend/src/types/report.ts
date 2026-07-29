export interface EarningReportItem {
    earningId: string;
    date: string;
    orderNumber: string;
    customerName: string;
    orderType: string;
    paymentMethod: string;
    grandTotal: number;
    status: string;
}

export interface OrderReportItem {
    orderNumber: string;
    date: string;
    customerName: string;
    tokenNo: string;
    orderType: string;
    menus: number;
    grandTotal: number;
    status: string;
}

export interface SalesReportItem {
    salesId: string;
    date: string;
    categoryName: string;
    itemsSold: number;
    totalOrders: number;
    grandTotal: number;
    status: string;
}

export interface CustomerReportItem {
    customerId: string;
    customerName: string;
    avatarPath: string | null;
    totalOrders: number;
    grandTotal: number;
}

export interface AuditLogItem {
    id: number;
    userId: number | null;
    userName: string;
    userEmail: string | null;
    action: string;
    module: string;
    entityType: string;
    entityId: number | null;
    description: string;
    oldValue: string | null;
    newValue: string | null;
    actionStatus: string;
    ipAddress: string | null;
    createdAt: string;
}

export interface AuditLogFilter {
    module?: string;
    action?: string;
    status?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
}

export type ReportType = 'earning' | 'orders' | 'sales' | 'customers' | 'audit';

export interface ReportFilter {
    fromDate?: string;
    toDate?: string;
    customerName?: string;
    paymentMethod?: string;
    categoryName?: string;
    page?: number;
    size?: number;
}
