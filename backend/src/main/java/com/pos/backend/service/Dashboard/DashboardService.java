package com.pos.backend.service.Dashboard;

import java.util.List;

import com.pos.backend.dto.request.Dashboard.DashboardFilterRequest;
import com.pos.backend.dto.response.Dashboard.ActiveOrderResponse;
import com.pos.backend.dto.response.Dashboard.ActivityLogResponse;
import com.pos.backend.dto.response.Dashboard.CategoryStatResponse;
import com.pos.backend.dto.response.Dashboard.DashboardStatsResponse;
import com.pos.backend.dto.response.Dashboard.DatePointResponse;
import com.pos.backend.dto.response.Dashboard.ReservationResponse;
import com.pos.backend.dto.response.Dashboard.SalesPerformanceResponse;
import com.pos.backend.dto.response.Dashboard.TableAvailabilityResponse;
import com.pos.backend.dto.response.Dashboard.TopSellingItemResponse;
import com.pos.backend.dto.response.Dashboard.TrendingMenuResponse;
import com.pos.backend.dto.response.Dashboard.UserStatisticsResponse;

public interface DashboardService {

    DashboardStatsResponse getStats(DashboardFilterRequest filter);

    List<DatePointResponse> getRevenueChart(DashboardFilterRequest filter);

    List<TopSellingItemResponse> getTopSellingItems(DashboardFilterRequest filter, int limit);

    List<CategoryStatResponse> getCategoryStats(DashboardFilterRequest filter);

    List<ActiveOrderResponse> getActiveOrders(int limit);

    List<SalesPerformanceResponse> getSalesPerformance(DashboardFilterRequest filter);

    List<TrendingMenuResponse> getTrendingMenus(DashboardFilterRequest filter, int limit);

    UserStatisticsResponse getUserStatistics(DashboardFilterRequest filter);

    List<ReservationResponse> getReservations(int limit);

    List<TableAvailabilityResponse> getAvailableTables(int limit);

    List<ActivityLogResponse> getRecentActivityLogs(DashboardFilterRequest filter, int limit);
}
