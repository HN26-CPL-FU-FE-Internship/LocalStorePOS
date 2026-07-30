package com.pos.backend.service.Dashboard.metrics;

import java.time.LocalDateTime;
import java.util.List;

import com.pos.backend.dto.response.Dashboard.ActivityLogResponse;

public interface NotificationMetricProvider {

    List<ActivityLogResponse> getRecentActivityLogs(LocalDateTime fromDate, LocalDateTime toDate, int limit);
}
