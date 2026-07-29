import { api } from '@/lib';
import type { ApiResponse } from '@/types/auth';
import type { AuditLogFilter, AuditLogItem, EarningReportItem, OrderReportItem, SalesReportItem, CustomerReportItem, ReportFilter } from '@/types/report';

interface PageResult<T> {
    items: T[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
    first: boolean;
    last: boolean;
}

const reportService = {
    getEarningReport: async (filter: ReportFilter) => {
        const res = await api.get<ApiResponse<PageResult<EarningReportItem>>>('/reports/earning', {
            params: {
                ...filter,
                page: filter.page ?? 0,
                size: filter.size ?? 10,
            },
        });
        return res.data;
    },

    getOrderReport: async (filter: ReportFilter) => {
        const res = await api.get<ApiResponse<PageResult<OrderReportItem>>>('/reports/orders', {
            params: {
                fromDate: filter.fromDate,
                toDate: filter.toDate,
                customerName: filter.customerName,
                page: filter.page ?? 0,
                size: filter.size ?? 10,
            },
        });
        return res.data;
    },

    getSalesReport: async (filter: ReportFilter) => {
        const res = await api.get<ApiResponse<PageResult<SalesReportItem>>>('/reports/sales', {
            params: {
                fromDate: filter.fromDate,
                toDate: filter.toDate,
                categoryName: filter.categoryName,
                page: filter.page ?? 0,
                size: filter.size ?? 10,
            },
        });
        return res.data;
    },

    getCustomerReport: async (filter: ReportFilter) => {
        const res = await api.get<ApiResponse<PageResult<CustomerReportItem>>>('/reports/customers', {
            params: {
                fromDate: filter.fromDate,
                toDate: filter.toDate,
                customerName: filter.customerName,
                page: filter.page ?? 0,
                size: filter.size ?? 10,
            },
        });
        return res.data;
    },

    getAuditLogs: async (filter: AuditLogFilter) => {
        const res = await api.get<ApiResponse<PageResult<AuditLogItem>>>('/audit-logs', {
            params: {
                module: filter.module || undefined,
                action: filter.action || undefined,
                status: filter.status || undefined,
                search: filter.search || undefined,
                fromDate: filter.fromDate || undefined,
                toDate: filter.toDate || undefined,
                page: filter.page ?? 0,
                size: filter.size ?? 10,
            },
        });
        return res.data;
    },

    getAuditModules: async () => {
        const res = await api.get<ApiResponse<string[]>>('/audit-logs/modules');
        return res.data;
    },
};

export default reportService;
