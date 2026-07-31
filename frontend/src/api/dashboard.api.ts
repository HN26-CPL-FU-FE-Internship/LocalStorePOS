import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';

export interface DashboardFilterRequest {
    fromDate?: string;
    toDate?: string;
}

// ── Activity Logs ────────────────────────────────────────────────

export interface ActivityLogItemResponse {
    id: string;
    icon: string;
    color: string;
    message: string;
    time: string;
}

export interface ActivityLogResponse {
    heading: string;
    items: ActivityLogItemResponse[];
}

// ── Reservations ─────────────────────────────────────────────────

export interface DashboardReservationResponse {
    id: number;
    day: string;
    year: string;
    customerName: string;
    time: string;
    tables: number;
    guests: number;
    status: string;
    statusVariant: string;
}

// ── Stats ────────────────────────────────────────────────────────

export interface DashboardStatsResponse {
    totalOrders: number;
    totalSales: number;
    averageOrderValue: number;
    totalReservations: number;
}

// ── Revenue Chart ────────────────────────────────────────────────

export interface DatePointResponse {
    label: string;
    value: number;
}

// ── Top Selling Items ────────────────────────────────────────────

export interface TopSellingItemResponse {
    rank: number;
    name: string;
    imageUrl?: string;
    orders: number;
}

// ── Category Stats ───────────────────────────────────────────────

export interface CategoryStatResponse {
    label: string;
    icon: string;
    color: string;
    orders: number;
}

// ── Active Orders ────────────────────────────────────────────────

export interface ActiveOrderResponse {
    id: number;
    customerName: string;
    avatarUrl?: string;
    type?: string;
    tableNo?: string;
    status?: string;
    statusVariant: string;
}

// ── Sales Performance ────────────────────────────────────────────

export interface SalesPerformanceResponse {
    label: string;
    value: string;
    change: string;
    icon: string;
    color: string;
}

// ── Trending Menus ───────────────────────────────────────────────

export interface TrendingMenuResponse {
    id: number;
    name: string;
    imageUrl?: string;
    orders: number;
    dietType: string;
}

// ── User Statistics ──────────────────────────────────────────────

export interface UserStatisticsResponse {
    topUserName: string;
    topUserAvatarUrl?: string;
    grandTotal: string;
    totalNewUsers: string;
    newUsersChange: string;
    newUserAvatars: AvatarStackResponse[];
    newUsersChart?: ChartPointResponse[];
}

export interface ChartPointResponse {
    label: string;
    value: number;
}

export interface AvatarStackResponse {
    id: number;
    imageUrl?: string;
    alt: string;
}

// ── Table Availability ───────────────────────────────────────────

export interface TableAvailabilityResponse {
    id: number;
    name: string;
    guests: number;
    imageUrl?: string;
}

// ── Utility ──────────────────────────────────────────────────────

export const formatLocalDate = (date?: string | Date): string | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export const getDashboardStats = async (filter: DashboardFilterRequest = {}): Promise<DashboardStatsResponse> => {
    const { data } = await api.get<ApiResponse<DashboardStatsResponse>>('/dashboard/stats', {
        params: {
            fromDate: formatLocalDate(filter.fromDate),
            toDate: formatLocalDate(filter.toDate),
        },
    });
    return data.result;
};

export const getRevenueChart = async (filter: DashboardFilterRequest = {}): Promise<DatePointResponse[]> => {
    const { data } = await api.get<ApiResponse<DatePointResponse[]>>('/dashboard/revenue-chart', {
        params: {
            fromDate: formatLocalDate(filter.fromDate),
            toDate: formatLocalDate(filter.toDate),
        },
    });
    return data.result;
};

export const getTopSellingItems = async (
    filter: DashboardFilterRequest = {},
    limit = 5,
): Promise<TopSellingItemResponse[]> => {
    const { data } = await api.get<ApiResponse<TopSellingItemResponse[]>>('/dashboard/top-items', {
        params: {
            fromDate: formatLocalDate(filter.fromDate),
            toDate: formatLocalDate(filter.toDate),
            limit,
        },
    });
    return data.result;
};

export const getCategoryStats = async (filter: DashboardFilterRequest = {}): Promise<CategoryStatResponse[]> => {
    const { data } = await api.get<ApiResponse<CategoryStatResponse[]>>('/dashboard/category-stats', {
        params: {
            fromDate: formatLocalDate(filter.fromDate),
            toDate: formatLocalDate(filter.toDate),
        },
    });
    return data.result;
};

export const getActiveOrders = async (limit = 5): Promise<ActiveOrderResponse[]> => {
    const { data } = await api.get<ApiResponse<ActiveOrderResponse[]>>('/dashboard/active-orders', {
        params: { limit },
    });
    return data.result;
};

export const getSalesPerformance = async (filter: DashboardFilterRequest = {}): Promise<SalesPerformanceResponse[]> => {
    const { data } = await api.get<ApiResponse<SalesPerformanceResponse[]>>('/dashboard/sales-performance', {
        params: {
            fromDate: formatLocalDate(filter.fromDate),
            toDate: formatLocalDate(filter.toDate),
        },
    });
    return data.result;
};

export const getTrendingMenus = async (
    filter: DashboardFilterRequest = {},
    limit = 6,
): Promise<TrendingMenuResponse[]> => {
    const { data } = await api.get<ApiResponse<TrendingMenuResponse[]>>('/dashboard/trending-menus', {
        params: {
            fromDate: formatLocalDate(filter.fromDate),
            toDate: formatLocalDate(filter.toDate),
            limit,
        },
    });
    return data.result;
};

export const getUserStatistics = async (filter: DashboardFilterRequest = {}): Promise<UserStatisticsResponse> => {
    const { data } = await api.get<ApiResponse<UserStatisticsResponse>>('/dashboard/user-statistics', {
        params: {
            fromDate: formatLocalDate(filter.fromDate),
            toDate: formatLocalDate(filter.toDate),
        },
    });
    return data.result;
};

export const getDashboardReservations = async (limit = 5): Promise<DashboardReservationResponse[]> => {
    const { data } = await api.get<ApiResponse<DashboardReservationResponse[]>>('/dashboard/reservations', {
        params: { limit },
    });
    return data.result;
};

export const getAvailableTables = async (limit = 6): Promise<TableAvailabilityResponse[]> => {
    const { data } = await api.get<ApiResponse<TableAvailabilityResponse[]>>('/dashboard/available-tables', {
        params: { limit },
    });
    return data.result;
};

export const getRecentActivityLogs = async (
    filter: DashboardFilterRequest = {},
    limit = 20,
): Promise<ActivityLogResponse[]> => {
    const { data } = await api.get<ApiResponse<ActivityLogResponse[]>>('/dashboard/recent-activity', {
        params: {
            fromDate: formatLocalDate(filter.fromDate),
            toDate: formatLocalDate(filter.toDate),
            limit,
        },
    });
    return data.result;
};
