package com.pos.backend.service.Dashboard.metrics;

import java.util.List;

import com.pos.backend.dto.response.Dashboard.TableAvailabilityResponse;

public interface TableMetricProvider {

    List<TableAvailabilityResponse> getAvailableTables(int limit);
}
