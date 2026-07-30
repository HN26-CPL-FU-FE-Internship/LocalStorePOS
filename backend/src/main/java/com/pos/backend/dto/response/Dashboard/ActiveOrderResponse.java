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
public class ActiveOrderResponse {

    private long id;
    private String customerName;
    private String avatarUrl;
    private String type;
    private String tableNo;
    private String status;
    private String statusVariant;
}
