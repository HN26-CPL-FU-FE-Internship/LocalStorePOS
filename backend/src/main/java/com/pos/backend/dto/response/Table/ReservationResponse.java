package com.pos.backend.dto.response.Table;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReservationResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long tableId;
    private String tableNumber;
    private LocalDateTime reservationTime;
    private Integer guests;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
}
