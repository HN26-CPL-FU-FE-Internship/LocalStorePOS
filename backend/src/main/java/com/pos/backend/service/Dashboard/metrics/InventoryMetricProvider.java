package com.pos.backend.service.Dashboard.metrics;

import java.time.LocalDateTime;
import java.util.List;

import com.pos.backend.dto.response.Dashboard.CategoryStatResponse;
import com.pos.backend.dto.response.Dashboard.TopSellingItemResponse;
import com.pos.backend.dto.response.Dashboard.TrendingMenuResponse;

public interface InventoryMetricProvider {

    List<TopSellingItemResponse> getTopSellingItems(LocalDateTime fromDate, LocalDateTime toDate, int limit);

    List<CategoryStatResponse> getCategoryStats(LocalDateTime fromDate, LocalDateTime toDate);

    List<TrendingMenuResponse> getTrendingMenus(LocalDateTime fromDate, LocalDateTime toDate, int limit);
}
