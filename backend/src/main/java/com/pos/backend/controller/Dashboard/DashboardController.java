package com.pos.backend.controller.Dashboard;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.service.Dashboard.DashboardService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DashboardController {

    DashboardService dashboardService;

    @GetMapping("/stats")
    @PreAuthorize("@perm.hasPermission(authentication, 'Dashboard', 'view')")
    public ApiResponse<DashboardStatsResponse> getStats(@Valid DashboardFilterRequest filter) {
        return ApiResponse.<DashboardStatsResponse>builder()
                .result(dashboardService.getStats(filter))
                .build();
    }

    @GetMapping("/revenue-chart")
    @PreAuthorize("@perm.hasPermission(authentication, 'Dashboard', 'view')")
    public ApiResponse<List<DatePointResponse>> getRevenueChart(@Valid DashboardFilterRequest filter) {
        return ApiResponse.<List<DatePointResponse>>builder()
                .result(dashboardService.getRevenueChart(filter))
                .build();
    }

    @GetMapping("/top-items")
    @PreAuthorize("@perm.hasPermission(authentication, 'Dashboard', 'view')")
    public ApiResponse<List<TopSellingItemResponse>> getTopItems(
            @Valid DashboardFilterRequest filter,
            @RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.<List<TopSellingItemResponse>>builder()
                .result(dashboardService.getTopSellingItems(filter, clampLimit(limit)))
                .build();
    }

    @GetMapping("/category-stats")
    @PreAuthorize("@perm.hasPermission(authentication, 'Dashboard', 'view')")
    public ApiResponse<List<CategoryStatResponse>> getCategoryStats(@Valid DashboardFilterRequest filter) {
        return ApiResponse.<List<CategoryStatResponse>>builder()
                .result(dashboardService.getCategoryStats(filter))
                .build();
    }

    @GetMapping("/active-orders")
    @PreAuthorize("@perm.hasPermission(authentication, 'Dashboard', 'view')")
    public ApiResponse<List<ActiveOrderResponse>> getActiveOrders(
            @RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.<List<ActiveOrderResponse>>builder()
                .result(dashboardService.getActiveOrders(clampLimit(limit)))
                .build();
    }

    @GetMapping("/sales-performance")
    @PreAuthorize("@perm.hasPermission(authentication, 'Dashboard', 'view')")
    public ApiResponse<List<SalesPerformanceResponse>> getSalesPerformance(@Valid DashboardFilterRequest filter) {
        return ApiResponse.<List<SalesPerformanceResponse>>builder()
                .result(dashboardService.getSalesPerformance(filter))
                .build();
    }

    @GetMapping("/trending-menus")
    @PreAuthorize("@perm.hasPermission(authentication, 'Dashboard', 'view')")
    public ApiResponse<List<TrendingMenuResponse>> getTrendingMenus(
            @Valid DashboardFilterRequest filter,
            @RequestParam(defaultValue = "6") int limit) {
        return ApiResponse.<List<TrendingMenuResponse>>builder()
                .result(dashboardService.getTrendingMenus(filter, clampLimit(limit)))
                .build();
    }

    @GetMapping("/user-statistics")
    @PreAuthorize("@perm.hasPermission(authentication, 'Dashboard', 'view')")
    public ApiResponse<UserStatisticsResponse> getUserStatistics(@Valid DashboardFilterRequest filter) {
        return ApiResponse.<UserStatisticsResponse>builder()
                .result(dashboardService.getUserStatistics(filter))
                .build();
    }

    @GetMapping("/reservations")
    @PreAuthorize("@perm.hasPermission(authentication, 'Dashboard', 'view')")
    public ApiResponse<List<ReservationResponse>> getReservations(
            @RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.<List<ReservationResponse>>builder()
                .result(dashboardService.getReservations(clampLimit(limit)))
                .build();
    }

    @GetMapping("/available-tables")
    @PreAuthorize("@perm.hasPermission(authentication, 'Dashboard', 'view')")
    public ApiResponse<List<TableAvailabilityResponse>> getAvailableTables(
            @RequestParam(defaultValue = "6") int limit) {
        return ApiResponse.<List<TableAvailabilityResponse>>builder()
                .result(dashboardService.getAvailableTables(clampLimit(limit)))
                .build();
    }

    @GetMapping("/recent-activity")
    @PreAuthorize("@perm.hasPermission(authentication, 'Dashboard', 'view')")
    public ApiResponse<List<ActivityLogResponse>> getRecentActivity(
            @Valid DashboardFilterRequest filter,
            @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.<List<ActivityLogResponse>>builder()
                .result(dashboardService.getRecentActivityLogs(filter, clampLimit(limit)))
                .build();
    }

    private int clampLimit(int limit) {
        return Math.max(1, Math.min(limit, 100));
    }
}
