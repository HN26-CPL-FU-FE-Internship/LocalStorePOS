package com.pos.backend.service.Dashboard.metrics;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.pos.backend.dto.response.Dashboard.ReservationResponse;
import com.pos.backend.entity.Reservation;
import com.pos.backend.repository.ReservationRepository;
import com.pos.backend.util.LocalDateTimeUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReservationMetricProviderImpl implements ReservationMetricProvider {

    static final DateTimeFormatter DAY_FORMATTER = DateTimeFormatter.ofPattern("MMM dd");
    static final DateTimeFormatter YEAR_FORMATTER = DateTimeFormatter.ofPattern("yyyy");
    static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    ReservationRepository reservationRepository;

    @Override
    public long countReservations(LocalDateTime fromDate, LocalDateTime toDate) {
        return reservationRepository.countReservationsBetween(fromDate, toDate);
    }

    @Override
    public List<ReservationResponse> getUpcomingReservations(LocalDateTime fromDate, LocalDateTime toDate, int limit) {
        LocalDateTime now = LocalDateTimeUtil.getTimeNow();
        LocalDateTime effectiveFrom = fromDate != null ? fromDate : now;
        LocalDateTime effectiveTo = toDate != null ? toDate : now.plusDays(30);
        List<Reservation> reservations = reservationRepository.findUpcomingReservationsBetween(effectiveFrom,
                effectiveTo, PageRequest.of(0, limit));
        return reservations.stream()
                .map(this::toReservationResponse)
                .toList();
    }

    private ReservationResponse toReservationResponse(Reservation reservation) {
        LocalDateTime reservationTime = reservation.getReservationTime();
        String customerName = Optional.ofNullable(reservation.getCustomer())
                .map(com.pos.backend.entity.Customer::getName)
                .orElse("Walk in Customer");
        String status = reservation.getStatus() != null ? reservation.getStatus().name() : "Booked";

        return ReservationResponse.builder()
                .id(reservation.getId())
                .day(reservationTime.format(DAY_FORMATTER))
                .year(reservationTime.format(YEAR_FORMATTER))
                .customerName(customerName)
                .time(reservationTime.format(TIME_FORMATTER))
                .tables(reservation.getTable() != null ? 1 : 0)
                .guests(reservation.getGuests())
                .status(status)
                .statusVariant(mapStatusVariant(status))
                .build();
    }

    private String mapStatusVariant(String status) {
        return switch (Optional.ofNullable(status).orElse("").toLowerCase()) {
            case "paid" -> "purple";
            case "cancelled" -> "danger";
            case "completed" -> "primary";
            case "seated" -> "warning";
            default -> "success";
        };
    }
}
