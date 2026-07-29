package com.pos.backend.dto.request.Table;

import java.time.LocalDateTime;

import com.pos.backend.constant.enums.ReservationStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReservationRequest {

    @NotNull(message = "Customer is required")
    private Long customerId;

    @NotNull(message = "Table is required")
    private Long tableId;

    @NotNull(message = "Reservation time is required")
    private LocalDateTime reservationTime;

    @NotNull(message = "Guests count is required")
    @Positive(message = "Guests must be greater than 0")
    private Integer guests;

    private String notes;

    private ReservationStatus status;
}
