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
public class SalesPerformanceResponse {

    private String label;
    private String value;
    private String change;
    private String icon;
    private String color;
}
