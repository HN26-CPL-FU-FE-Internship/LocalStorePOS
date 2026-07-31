package com.pos.backend.dto.response.Dashboard;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReservationResponse {

    private long id;
    private String day;
    private String year;
    private String customerName;
    private String time;
    private int tables;
    private int guests;
    private String status;
    private String statusVariant;
}
