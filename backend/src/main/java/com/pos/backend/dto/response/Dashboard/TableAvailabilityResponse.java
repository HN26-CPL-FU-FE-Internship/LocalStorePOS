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
public class TableAvailabilityResponse {

    private long id;
    private String name;
    private int guests;
    private String imageUrl;
}
