import { keepPreviousData, useQuery } from '@tanstack/react-query';
import reportService from '@/services/reportService';
import type { AuditLogFilter, ReportFilter } from '@/types/report';

const reportKeys = {
    all: ['reports'] as const,
    earning: (filter: ReportFilter) => ['reports', 'earning', filter] as const,
    orders: (filter: ReportFilter) => ['reports', 'orders', filter] as const,
    sales: (filter: ReportFilter) => ['reports', 'sales', filter] as const,
    customers: (filter: ReportFilter) => ['reports', 'customers', filter] as const,
    audit: (filter: AuditLogFilter) => ['reports', 'audit', filter] as const,
};

export function useEarningReport(filter: ReportFilter, enabled = true) {
    return useQuery({
        queryKey: reportKeys.earning(filter),
        queryFn: () => reportService.getEarningReport(filter),
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData,
        enabled,
        select: (data) => data.result,
    });
}

export function useOrderReport(filter: ReportFilter, enabled = true) {
    return useQuery({
        queryKey: reportKeys.orders(filter),
        queryFn: () => reportService.getOrderReport(filter),
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData,
        enabled,
        select: (data) => data.result,
    });
}

export function useSalesReport(filter: ReportFilter, enabled = true) {
    return useQuery({
        queryKey: reportKeys.sales(filter),
        queryFn: () => reportService.getSalesReport(filter),
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData,
        enabled,
        select: (data) => data.result,
    });
}

export function useCustomerReport(filter: ReportFilter, enabled = true) {
    return useQuery({
        queryKey: reportKeys.customers(filter),
        queryFn: () => reportService.getCustomerReport(filter),
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData,
        enabled,
        select: (data) => data.result,
    });
}

export function useAuditReport(filter: AuditLogFilter, enabled = true) {
    return useQuery({
        queryKey: reportKeys.audit(filter),
        queryFn: () => reportService.getAuditLogs(filter),
        staleTime: 1000 * 30,
        placeholderData: keepPreviousData,
        enabled,
        select: (data) => data.result,
    });
}

export function useAuditModules() {
    return useQuery({
        queryKey: ['reports', 'audit', 'modules'],
        queryFn: () => reportService.getAuditModules(),
        staleTime: 1000 * 60 * 30,
        select: (data) => data.result,
    });
}
