import { api } from '@/lib';
import type { ApiResponse } from '@/types/auth';
import type { EarningReportItem, OrderReportItem, SalesReportItem, CustomerReportItem, ReportFilter } from '@/types/report';

const reportService = {
    getEarningReport: async (filter: ReportFilter) => {
        const res = await api.get<ApiResponse<EarningReportItem[]>>('/reports/earning', {
            params: filter,
        });
        return res.data;
    },

    getOrderReport: async (filter: ReportFilter) => {
        const res = await api.get<ApiResponse<OrderReportItem[]>>('/reports/orders', {
            params: {
                fromDate: filter.fromDate,
                toDate: filter.toDate,
                customerName: filter.customerName,
            },
        });
        return res.data;
    },

    getSalesReport: async (filter: ReportFilter) => {
        const res = await api.get<ApiResponse<SalesReportItem[]>>('/reports/sales', {
            params: {
                fromDate: filter.fromDate,
                toDate: filter.toDate,
                categoryName: filter.categoryName,
            },
        });
        return res.data;
    },

    getCustomerReport: async (filter: ReportFilter) => {
        const res = await api.get<ApiResponse<CustomerReportItem[]>>('/reports/customers', {
            params: {
                fromDate: filter.fromDate,
                toDate: filter.toDate,
                customerName: filter.customerName,
            },
        });
        return res.data;
    },
};

export default reportService;
