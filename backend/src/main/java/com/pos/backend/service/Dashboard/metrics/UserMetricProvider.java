package com.pos.backend.service.Dashboard.metrics;

import java.time.LocalDateTime;

import com.pos.backend.dto.response.Dashboard.UserStatisticsResponse;

public interface UserMetricProvider {

    UserStatisticsResponse getUserStatistics(LocalDateTime fromDate, LocalDateTime toDate);
}
