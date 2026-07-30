package com.pos.backend.service.Dashboard.metrics;

import java.time.LocalDateTime;
import java.util.List;

import com.pos.backend.dto.response.Dashboard.DashboardStatsResponse;
import com.pos.backend.dto.response.Dashboard.DatePointResponse;
import com.pos.backend.dto.response.Dashboard.SalesPerformanceResponse;

public interface SalesMetricProvider {

    void fillSalesStats(DashboardStatsResponse stats, LocalDateTime fromDate, LocalDateTime toDate);

    List<DatePointResponse> getRevenueChart(LocalDateTime fromDate, LocalDateTime toDate);

    List<SalesPerformanceResponse> getSalesPerformance(LocalDateTime fromDate, LocalDateTime toDate);
}
