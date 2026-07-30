package com.pos.backend.service.Dashboard.metrics;

import java.time.LocalDateTime;
import java.util.List;

import com.pos.backend.dto.response.Dashboard.ReservationResponse;

public interface ReservationMetricProvider {

    long countReservations(LocalDateTime fromDate, LocalDateTime toDate);

    List<ReservationResponse> getUpcomingReservations(LocalDateTime fromDate, LocalDateTime toDate, int limit);
}
