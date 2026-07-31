package com.pos.backend.service.Dashboard.metrics;

import java.time.LocalDateTime;

import com.pos.backend.dto.response.Dashboard.ActiveOrderResponse;
import com.pos.backend.dto.response.Dashboard.DashboardStatsResponse;

import java.util.List;

public interface OrderMetricProvider {

    void fillOrderStats(DashboardStatsResponse stats, LocalDateTime fromDate, LocalDateTime toDate);

    List<ActiveOrderResponse> getActiveOrders(int limit);
}
