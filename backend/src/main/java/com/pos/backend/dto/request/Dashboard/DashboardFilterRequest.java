package com.pos.backend.dto.request.Dashboard;

import java.time.LocalDate;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DashboardFilterRequest {

    private LocalDate fromDate;
    private LocalDate toDate;
}
